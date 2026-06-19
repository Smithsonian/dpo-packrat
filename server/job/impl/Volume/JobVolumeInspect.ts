/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * JobVolumeInspect — local Node.js inspection job for volumetric capture ZIPs.
 *
 * Lifecycle: extends JobPackrat. `startJobWorker` runs all five inspection
 * stages synchronously, then calls `recordSuccess(JSON.stringify(output))`.
 *
 * The actual work is deferred via `setImmediate` so the parent workflow's
 * `waitForCompletion` has time to engage its mutex before our `recordSuccess`
 * triggers `signalCompletion`. Without the deferral, very fast inspections
 * could (in theory) race and miss the signal — though `WorkflowJob` also
 * guards via a `complete` flag for belt-and-suspenders safety.
 *
 * Stages:
 *   1. Archive pre-flight — ZIP opens, non-empty, content type detection.
 *   2. File inventory — count files/slices, detect duplicates.
 *   3. Sidecar parse — single dispatcher; currently handles .pca only.
 *   4. Header sampling — first slice TIFF or DICOM, parsed from disk.
 *   5. Cross-check + companion file tagging.
 */
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { imageSize } from 'image-size';

import { JobPackrat, JobIOResults } from '../NS';
import * as JOB from '../../interface';
import * as DBAPI from '../../../db';
import * as STORE from '../../../storage/interface';
import * as REP from '../../../report/interface';
import * as H from '../../../utils/helpers';
import { ZipFile } from '../../../utils/zipFile';
import { MetadataExtractor } from '../../../metadata/MetadataExtractor';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

import { JobVolumeInspectParameters } from './JobVolumeInspectParameters';
import { VolumeContentType, VolumeExtractedMetadata } from './JobVolumeInspectOutput';
import { parseSidecar, isSidecarFile, SidecarParseResult } from './sidecar';
import { DicomInspector } from './dicom/DicomInspector';

const SCAN_SHEET_REGEX = /(scan|sheet|log|report).*\.(pdf|jpg|jpeg|png|docx?)$/i;
const SCAN_LOG_REGEX = /\.(txt|log)$/i;
const TIFF_EXT_REGEX = /\.(tif|tiff)$/i;
const JPEG_EXT_REGEX = /\.(jpg|jpeg)$/i;
const PNG_EXT_REGEX = /\.png$/i;
// "Image Stack" is the single user-facing content type covering TIFF, JPEG
// and PNG slice archives. Format is detected per-entry from the extension.
const IMAGE_STACK_EXT_REGEX = /\.(tif|tiff|jpg|jpeg|png)$/i;
const DICOM_EXT_REGEX = /\.dcm$/i;

function imageSubtypeForEntry(entry: string): 'TIFF' | 'JPEG' | 'PNG' | null {
    if (TIFF_EXT_REGEX.test(entry)) return 'TIFF';
    if (JPEG_EXT_REGEX.test(entry)) return 'JPEG';
    if (PNG_EXT_REGEX.test(entry)) return 'PNG';
    return null;
}

/**
 * Stage 4b per-slice validation gate. Defaults to DISABLED — per-slice header
 * parsing is O(N) and can be very slow on large stacks. Enable it by setting
 * PACKRAT_VOLUME_PER_SLICE_VALIDATION to "true" or "1"; any other value (unset,
 * "false", "0") leaves it off.
 */
function isPerSliceValidationEnabled(): boolean {
    const raw: string | undefined = process.env.PACKRAT_VOLUME_PER_SLICE_VALIDATION;
    if (!raw) return false;
    const normalized: string = raw.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
}

const INSPECT_TEMP_PREFIX = '__inspect_';
const STALE_TEMP_MS = 6 * 60 * 60 * 1000;   // 6h — comfortably longer than any inspection

const setImmediateAsync = promisify(setImmediate);

export class JobVolumeInspect extends JobPackrat {
    private _parameters: JobVolumeInspectParameters;
    private _idAssetVersions: number[] | null;

    constructor(jobEngine: JOB.IJobEngine, idAssetVersions: number[] | null,
        report: REP.IReport | null, parameters: JobVolumeInspectParameters,
        dbJobRun: DBAPI.JobRun) {
        super(jobEngine, dbJobRun, report);
        this._parameters = parameters;
        this._idAssetVersions = idAssetVersions;
    }

    // #region IJob interface

    name(): string { return `Volume Inspect (${this._parameters.fileName})`; }
    configuration(): any { return { fileName: this._parameters.fileName, idAssetVersions: this._idAssetVersions }; }

    async initialize(): Promise<H.IOResults> {
        this._initialized = true;
        return { success: true };
    }

    /**
     * Sync local job — completion is signalled synchronously by `recordSuccess`
     * inside `startJobWorker`. The IJob `waitForCompletion` is not on the
     * critical path (the parent `WorkflowJob.waitForCompletion` is). Returns
     * the latest results if already done; otherwise resolves on the next tick.
     */
    async waitForCompletion(_timeout: number): Promise<H.IOResults> {
        await setImmediateAsync();
        return this._results;
    }

    // #endregion

    // #region JobPackrat overrides

    /**
     * Cancellation is a logged no-op. Inspection runs to completion in
     * seconds-to-minutes; threading an abort signal through every parser
     * costs more than it saves.
     */
    protected async cancelJobWorker(): Promise<H.IOResults> {
        RK.logInfo(RK.LogSection.eJOB, 'cancel volume inspect', 'no-op (inspection runs to completion)',
            { idJobRun: this._dbJobRun.idJobRun }, 'Job.VolumeInspect');
        return { success: true };
    }

    /** No post-processing needed — the JSON output is the entire result. */
    protected async cleanupJob(): Promise<H.IOResults> {
        return { success: true };
    }

    protected async startJobWorker(_fireDate: Date): Promise<JobIOResults> {
        // Defer work one tick so the parent workflow's waitForCompletion
        // engages its mutex before signalCompletion fires.
        await setImmediateAsync();

        try {
            const metadata: VolumeExtractedMetadata = await this.runInspection();
            await this.recordSuccess(JSON.stringify(metadata));
            return { success: true };
        } catch (err) {
            const errorMessage: string = err instanceof Error ? err.message : H.Helpers.getErrorString(err);
            RK.logError(RK.LogSection.eJOB, 'volume inspect failed', errorMessage,
                { idJobRun: this._dbJobRun.idJobRun, fileName: this._parameters.fileName },
                'Job.VolumeInspect');
            await this.recordFailure(null, errorMessage);
            return { success: false, error: errorMessage };
        }
    }

    // #endregion

    /** Resolve the asset version's staged file path on the local filesystem. */
    private async resolveStagedFilePath(): Promise<string> {
        if (!this._idAssetVersions || this._idAssetVersions.length === 0)
            throw new Error('No idAssetVersion provided to Volume Inspect');

        const idAssetVersion: number = this._idAssetVersions[0];
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
        if (!assetVersion)
            throw new Error(`Unable to fetch AssetVersion ${idAssetVersion}`);

        const storage: STORE.IStorage | null = await STORE.StorageFactory.getInstance();
        if (!storage)
            throw new Error('Unable to fetch StorageFactory instance');

        return await storage.stagingFileName(assetVersion.StorageKeyStaging);
    }

    private async runInspection(): Promise<VolumeExtractedMetadata> {
        const zipPath: string = await this.resolveStagedFilePath();
        const stagingDir: string = path.dirname(zipPath);
        return await inspectVolumeZip(zipPath, stagingDir);
    }
}

/**
 * Standalone inspection function — exported for direct unit testing without
 * the JobPackrat / workflow lifecycle. Runs all 5 stages and returns the
 * resulting metadata, or throws on fatal failure.
 */
export async function inspectVolumeZip(zipPath: string, stagingDir: string): Promise<VolumeExtractedMetadata> {
    const zip: ZipFile = new ZipFile(zipPath);
    const loadResult: H.IOResults = await zip.load();
    if (!loadResult.success)
        throw new Error(`Stage 1 (archive pre-flight): ${loadResult.error ?? 'failed to open ZIP'}`);

    try {
        const allEntries: string[] = await zip.getAllEntries(null);
        const fileEntries: string[] = await zip.getJustFiles(null);

        if (allEntries.length === 0 || fileEntries.length === 0)
            throw new Error('Stage 1 (archive pre-flight): ZIP is empty');

        // Best-effort: remove stale inspection temp files left in this staging dir by a
        // previously-crashed inspection. Normal runs unlink their own temps in finally;
        // this catches the crash case so __inspect_* files don't accumulate.
        await sweepStaleInspectTemps(stagingDir);

        // Stage 1: content-type detection. Image-stack covers TIFF, JPEG and
        // PNG slice formats under a single contentType — the per-slice subtype
        // is recovered from each entry's extension when we sample headers.
        const warnings: string[] = [];

        const imageEntries: string[] = fileEntries.filter(e => IMAGE_STACK_EXT_REGEX.test(e)).sort();
        const dicomSliceEntries: string[] = fileEntries.filter(e => DICOM_EXT_REGEX.test(e)).sort();
        const hasDicomDir: boolean = fileEntries.some(e => /(^|\/)DICOMDIR$/i.test(e));

        let contentType: VolumeContentType;
        if (imageEntries.length > 0) contentType = 'IMAGE_STACK';
        else if (dicomSliceEntries.length > 0 || hasDicomDir) contentType = 'DICOM';
        else contentType = 'OTHER';

        if (contentType === 'OTHER')
            throw new Error('Stage 1 (archive pre-flight): no image slices or DICOM instances found — user selected Volumetric but ZIP contains no recognizable scan data');

        // Stage 2: file inventory. Determine the slice set robustly so neither the
        // slice count nor the Z dimension is inflated by non-slice files:
        //   - DICOM: slices are the .dcm instances only; DICOMDIR is an index file.
        //   - Image stack: slices are the dominant image subtype. Off-format images
        //     (a thumbnail.png beside a TIFF stack, a scan-sheet photo) are companions.
        let sliceEntries: string[];
        if (contentType === 'IMAGE_STACK') {
            const bySubtype = new Map<string, string[]>();
            for (const e of imageEntries) {
                const st: string = imageSubtypeForEntry(e) ?? 'OTHER';
                const arr: string[] | undefined = bySubtype.get(st);
                if (arr) arr.push(e); else bySubtype.set(st, [e]);
            }
            let dominant: string[] = [];
            for (const group of bySubtype.values())
                if (group.length > dominant.length) dominant = group;
            sliceEntries = dominant.sort();
            const excluded: number = imageEntries.length - sliceEntries.length;
            if (excluded > 0)
                warnings.push(`${excluded} off-format image file(s) treated as companions, not slices`);
        } else {
            sliceEntries = dicomSliceEntries;
        }
        const sliceCount: number = sliceEntries.length;
        const fileCount: number = fileEntries.length;

        // Duplicate-entry detection keyed on the full relative path. The same basename
        // in different directories (multi-series seriesA/0001.dcm vs seriesB/0001.dcm)
        // is legitimate and must not be flagged.
        const seenPaths = new Map<string, number>();
        for (const entry of fileEntries) {
            const key: string = entry.toLowerCase();
            seenPaths.set(key, (seenPaths.get(key) ?? 0) + 1);
        }
        for (const [name, count] of seenPaths)
            if (count > 1)
                warnings.push(`Duplicate entry appears ${count}x: ${name}`);

        // Sequence-numbering continuity (warn-only, grouped per directory)
        checkSequenceContinuity(sliceEntries, warnings);

        // Stage 3: sidecar parse
        const sidecarEntries: string[] = fileEntries.filter(e => isSidecarFile(path.basename(e)));
        const vendorSidecarPaths: string[] = [...sidecarEntries];
        let sidecarResult: SidecarParseResult = { warnings: [] };
        for (const sidecarEntry of sidecarEntries) {
            const tempPath: string | null = await extractEntryToStaging(zip, sidecarEntry, stagingDir);
            if (!tempPath) continue;
            try {
                const result: SidecarParseResult | null = await parseSidecar(tempPath);
                if (result) sidecarResult = mergeSidecarResults(sidecarResult, result);
            } finally {
                await unlinkSafe(tempPath);
            }
        }
        warnings.push(...sidecarResult.warnings);

        // Stage 4: header sampling
        const headerData: HeaderSampleData = await sampleHeader(zip, sliceEntries, contentType, stagingDir, warnings);

        // Stage 4b: per-slice header validation (image-stack only). DICOM
        // instances are skipped — DICOM transfer-syntax variance is too broad
        // to validate cheaply, and the cross-checks with sidecar + first-slice
        // already cover the common failure modes there.
        //
        // For image stacks we run every slice through the same header sampler
        // used in Stage 4. Goals:
        //   - Catch corrupt / non-image entries (would have been a missing slice
        //     at downstream Cook stages).
        //   - Detect dimension drift across slices (warning, not fatal — some
        //     vendor workflows pad edge slices differently).
        // Cost: O(N) header parses per ZIP, but each parse only reads the
        // header bytes via streamContent + image-size / exiftool. Same order
        // of magnitude as the existing duplicate-filename scan.
        //
        // Off by default (O(N) header parses are costly on large stacks). Enable
        // with PACKRAT_VOLUME_PER_SLICE_VALIDATION=true (or 1) to validate every
        // slice's header.
        if (contentType === 'IMAGE_STACK' && isPerSliceValidationEnabled()) {
            await validateImageStackSlices(zip, sliceEntries, headerData, stagingDir, warnings);
        }

        // Stage 5: cross-check + companion file tagging. The slice count and
        // dimensions found in the ZIP are authoritative; a vendor sidecar that
        // disagrees is reported as a warning but does NOT fail ingest. Sidecars
        // frequently count projections/darks or use a different convention, so a
        // mismatch is informational — we always use the values found in the ZIP.
        if (sidecarResult.declaredSliceCount !== undefined && sidecarResult.declaredSliceCount !== sliceCount)
            warnings.push(`Sidecar declares ${sidecarResult.declaredSliceCount} slices but ZIP contains ${sliceCount} (using ${sliceCount})`);
        if (sidecarResult.declaredDimensionsX !== undefined && headerData.dimensionsX !== undefined
            && sidecarResult.declaredDimensionsX !== headerData.dimensionsX)
            warnings.push(`Sidecar declares dimensionsX=${sidecarResult.declaredDimensionsX} but header reports ${headerData.dimensionsX} (using ${headerData.dimensionsX})`);
        if (sidecarResult.declaredDimensionsY !== undefined && headerData.dimensionsY !== undefined
            && sidecarResult.declaredDimensionsY !== headerData.dimensionsY)
            warnings.push(`Sidecar declares dimensionsY=${sidecarResult.declaredDimensionsY} but header reports ${headerData.dimensionsY} (using ${headerData.dimensionsY})`);

        const scanSheetPaths: string[] = fileEntries.filter(e => SCAN_SHEET_REGEX.test(path.basename(e)));
        const scanLogPaths: string[] = fileEntries.filter(e => SCAN_LOG_REGEX.test(path.basename(e)));

        return {
            fileCount,
            sliceCount,
            contentType,
            dimensionsX: headerData.dimensionsX,
            dimensionsY: headerData.dimensionsY,
            dimensionsZ: sliceCount,           // Z is the slice axis for any volumetric stack
            bitDepth: headerData.bitDepth,
            voxelSizeX: sidecarResult.voxelSizeX ?? headerData.voxelSizeX,
            voxelSizeY: sidecarResult.voxelSizeY ?? headerData.voxelSizeY,
            voxelSizeZ: sidecarResult.voxelSizeZ ?? headerData.voxelSizeZ,
            voxelSizeUnit: sidecarResult.voxelSizeUnit ?? headerData.voxelSizeUnit,
            modality: headerData.modality,      // DICOM (0008,0060); sidecars don't carry it
            voltageKV: sidecarResult.voltageKV ?? headerData.voltageKV,
            amperageUA: sidecarResult.amperageUA ?? headerData.amperageUA,
            scannerMakeModel: sidecarResult.scannerMakeModel ?? headerData.scannerMakeModel,
            scanSheetPaths,
            scanLogPaths,
            vendorSidecarPaths,
            warnings,
        };
    } finally {
        await zip.close();
    }
}

async function sampleHeader(zip: ZipFile, sliceEntries: string[], contentType: VolumeContentType,
    stagingDir: string, warnings: string[]): Promise<HeaderSampleData> {
    const candidates: string[] = sliceEntries.slice(0, 2);                  // try slice 0, fallback to slice 1
    for (const entry of candidates) {
        const tempPath: string | null = await extractEntryToStaging(zip, entry, stagingDir);
        if (!tempPath) {
            warnings.push(`Failed to extract sample slice ${entry} to staging`);
            continue;
        }
        try {
            if (contentType === 'IMAGE_STACK') {
                const sample: HeaderSampleData = await sampleImageSlice(tempPath, entry, warnings);
                if (sample.dimensionsX !== undefined || sample.bitDepth !== undefined)
                    return sample;
            } else if (contentType === 'DICOM') {
                const sample: HeaderSampleData = await sampleDicom(tempPath, warnings);
                if (sample.dimensionsX !== undefined || sample.bitDepth !== undefined)
                    return sample;
            }
        } finally {
            await unlinkSafe(tempPath);
        }
    }
    warnings.push('Stage 4 (header sampling): no slice header could be parsed');
    return {};
}

/** Stream a ZIP entry to a uniquely-named temp file under stagingDir. Returns the temp path or null on failure. */
async function extractEntryToStaging(zip: ZipFile, entry: string, stagingDir: string): Promise<string | null> {
    const stream: NodeJS.ReadableStream | null = await zip.streamContent(entry);
    if (!stream) return null;
    const tempPath: string = path.join(stagingDir, `__inspect_${crypto.randomUUID()}_${path.basename(entry)}`);
    try {
        await pipelineToFile(stream, tempPath);
        return tempPath;
    } catch (err) {
        await unlinkSafe(tempPath);
        RK.logError(RK.LogSection.eJOB, 'extract entry failed', H.Helpers.getErrorString(err),
            { entry, tempPath }, 'Job.VolumeInspect');
        return null;
    }
}

/**
 * Warn-only check that slice filenames have a numeric component that increments
 * without gaps. Grouped per parent directory so interleaved multi-series stacks
 * (seriesA/1,2 + seriesB/1,2) are each treated as their own clean sequence rather
 * than producing false gaps.
 */
function checkSequenceContinuity(sliceEntries: string[], warnings: string[]): void {
    const byDir = new Map<string, number[]>();
    for (const entry of sliceEntries) {
        const match: RegExpMatchArray | null = path.basename(entry).match(/(\d+)(?=\.[^.]+$)/);
        if (!match) continue;
        const dir: string = path.dirname(entry);
        const n: number = parseInt(match[1], 10);
        const arr: number[] | undefined = byDir.get(dir);
        if (arr) arr.push(n); else byDir.set(dir, [n]);
    }
    for (const [dir, numbers] of byDir) {
        if (numbers.length < 2) continue;
        numbers.sort((a, b) => a - b);
        for (let i = 1; i < numbers.length; i++) {
            if (numbers[i] !== numbers[i - 1] + 1) {
                warnings.push(`Slice sequence has a gap in ${dir || '.'} between ${numbers[i - 1]} and ${numbers[i]}`);
                break;
            }
        }
    }
}

// #region helpers — module-scope so the class stays focused on lifecycle

interface HeaderSampleData {
    dimensionsX?: number;
    dimensionsY?: number;
    bitDepth?: number;
    voxelSizeX?: number;
    voxelSizeY?: number;
    voxelSizeZ?: number;
    voxelSizeUnit?: 'Micrometer' | 'Millimeter';
    voltageKV?: number;
    amperageUA?: number;
    scannerMakeModel?: string;
    modality?: string;
}

/**
 * Inspect a single image-stack slice (TIFF / JPEG / PNG) and return its
 * dimensions and bit depth. Returns `{}` and pushes a warning on parse
 * failure — the caller decides whether that's fatal.
 *
 * Format dispatch is by extension. TIFF goes through MetadataExtractor
 * (exiftool); JPEG and PNG use the synchronous `image-size` library,
 * matching the photogrammetry validation pipeline so a slice that wouldn't
 * be accepted as a photogrammetry image isn't silently accepted here.
 */
async function inspectImageSlice(filePath: string, entryName: string): Promise<{ data: HeaderSampleData; error?: string }> {
    const subtype: 'TIFF' | 'JPEG' | 'PNG' | null = imageSubtypeForEntry(entryName);
    if (!subtype)
        return { data: {}, error: `unrecognized image extension for ${entryName}` };

    if (subtype === 'TIFF') {
        const extractor: MetadataExtractor = new MetadataExtractor();
        const result: H.IOResults = await extractor.extractMetadata(filePath);
        if (!result.success)
            return { data: {}, error: `TIFF header parse failed: ${result.error}` };

        const md: Map<string, string> = extractor.metadata;
        const data: HeaderSampleData = {};
        data.dimensionsX = readPositiveInt(md, ['ImageWidth', 'imagewidth']);
        data.dimensionsY = readPositiveInt(md, ['ImageHeight', 'ImageLength', 'imageheight', 'imagelength']);
        data.bitDepth = readPositiveInt(md, ['BitsPerSample', 'bitspersample']);
        return { data };
    }

    // JPEG / PNG: image-size reads the header bytes only — fast and synchronous.
    try {
        const dims = imageSize(filePath);
        if (!dims || !dims.width || !dims.height)
            return { data: {}, error: `${subtype} header parse returned no dimensions` };
        const data: HeaderSampleData = {
            dimensionsX: dims.width,
            dimensionsY: dims.height,
        };
        // JPEG has no header bit-depth field; PNG always reports bit-depth.
        if (subtype === 'PNG' && typeof (dims as any).bitDepth === 'number')
            data.bitDepth = (dims as any).bitDepth;
        return { data };
    } catch (err) {
        return { data: {}, error: `${subtype} header parse threw: ${H.Helpers.getErrorString(err)}` };
    }
}

/** Header-sampling shim used by Stage 4. Pushes warnings on parse failure rather than throwing. */
async function sampleImageSlice(filePath: string, entryName: string, warnings: string[]): Promise<HeaderSampleData> {
    const result = await inspectImageSlice(filePath, entryName);
    if (result.error) warnings.push(result.error);
    return result.data;
}

/**
 * Stage 4b: validate every entry in an image-stack slice list. Reports:
 *   - per-slice header parse failures as warnings (with the entry name)
 *   - dimension drift across slices as a single aggregated warning
 *
 * The dimension baseline is `headerData` when available; otherwise the first
 * successfully-parsed slice in this loop. Slices that fail to parse are
 * logged once each rather than aborting the whole inspection — Cook will
 * surface a hard failure later if the corrupt slice actually blocks downstream
 * processing.
 */
async function validateImageStackSlices(zip: ZipFile, sliceEntries: string[], headerData: HeaderSampleData,
    stagingDir: string, warnings: string[]): Promise<void> {

    let baselineX: number | undefined = headerData.dimensionsX;
    let baselineY: number | undefined = headerData.dimensionsY;
    let failures: number = 0;
    let mismatches: number = 0;
    const sampleMismatch: string[] = [];

    for (const entry of sliceEntries) {
        const tempPath: string | null = await extractEntryToStaging(zip, entry, stagingDir);
        if (!tempPath) {
            failures++;
            warnings.push(`Slice ${entry}: failed to extract for validation`);
            continue;
        }
        try {
            const result = await inspectImageSlice(tempPath, entry);
            if (result.error) {
                failures++;
                warnings.push(`Slice ${entry}: ${result.error}`);
                continue;
            }
            if (baselineX === undefined && result.data.dimensionsX !== undefined) baselineX = result.data.dimensionsX;
            if (baselineY === undefined && result.data.dimensionsY !== undefined) baselineY = result.data.dimensionsY;
            if (baselineX !== undefined && result.data.dimensionsX !== undefined && result.data.dimensionsX !== baselineX) {
                mismatches++;
                if (sampleMismatch.length < 3) sampleMismatch.push(`${entry} (${result.data.dimensionsX}x${result.data.dimensionsY ?? '?'})`);
            } else if (baselineY !== undefined && result.data.dimensionsY !== undefined && result.data.dimensionsY !== baselineY) {
                mismatches++;
                if (sampleMismatch.length < 3) sampleMismatch.push(`${entry} (${result.data.dimensionsX ?? '?'}x${result.data.dimensionsY})`);
            }
        } finally {
            await unlinkSafe(tempPath);
        }
    }

    if (failures > 0)
        warnings.push(`Stage 4b (per-slice validation): ${failures}/${sliceEntries.length} slice(s) failed header parse`);
    if (mismatches > 0)
        warnings.push(`Stage 4b (per-slice validation): ${mismatches} slice(s) differ from baseline ${baselineX ?? '?'}x${baselineY ?? '?'}; samples: ${sampleMismatch.join(', ')}`);
}

async function sampleDicom(filePath: string, warnings: string[]): Promise<HeaderSampleData> {
    const dicom = await DicomInspector.inspectFile(filePath);
    warnings.push(...dicom.warnings);
    const data: HeaderSampleData = {};
    if (dicom.columns !== undefined) data.dimensionsX = dicom.columns;
    if (dicom.rows !== undefined) data.dimensionsY = dicom.rows;
    if (dicom.bitsAllocated !== undefined) data.bitDepth = dicom.bitsAllocated;

    // DICOM PixelSpacing is in mm by convention; SliceThickness in mm too.
    if (dicom.pixelSpacingRow !== undefined || dicom.pixelSpacingColumn !== undefined || dicom.sliceThicknessMM !== undefined) {
        data.voxelSizeUnit = 'Millimeter';
        data.voxelSizeY = dicom.pixelSpacingRow;
        data.voxelSizeX = dicom.pixelSpacingColumn;
        data.voxelSizeZ = dicom.sliceThicknessMM;
    }
    if (dicom.voltageKV !== undefined) data.voltageKV = dicom.voltageKV;
    if (dicom.tubeCurrentMA !== undefined) data.amperageUA = dicom.tubeCurrentMA * 1000;     // mA → µA

    const make: string = (dicom.manufacturer ?? '').trim();
    const model: string = (dicom.manufacturerModelName ?? '').trim();
    const combined: string = [make, model].filter(s => s.length > 0).join(' ');
    if (combined.length > 0) data.scannerMakeModel = combined;
    if (dicom.modality !== undefined) data.modality = dicom.modality;
    return data;
}

function readPositiveInt(md: Map<string, string>, keys: string[]): number | undefined {
    for (const key of keys) {
        const raw: string | undefined = md.get(key);
        if (raw === undefined) continue;
        const n: number = parseInt(raw, 10);
        if (!Number.isNaN(n) && n > 0) return n;
    }
    return undefined;
}

function mergeSidecarResults(a: SidecarParseResult, b: SidecarParseResult): SidecarParseResult {
    return {
        voxelSizeX: b.voxelSizeX ?? a.voxelSizeX,
        voxelSizeY: b.voxelSizeY ?? a.voxelSizeY,
        voxelSizeZ: b.voxelSizeZ ?? a.voxelSizeZ,
        voxelSizeUnit: b.voxelSizeUnit ?? a.voxelSizeUnit,
        voltageKV: b.voltageKV ?? a.voltageKV,
        amperageUA: b.amperageUA ?? a.amperageUA,
        scannerMakeModel: b.scannerMakeModel ?? a.scannerMakeModel,
        declaredSliceCount: b.declaredSliceCount ?? a.declaredSliceCount,
        declaredDimensionsX: b.declaredDimensionsX ?? a.declaredDimensionsX,
        declaredDimensionsY: b.declaredDimensionsY ?? a.declaredDimensionsY,
        warnings: [...a.warnings, ...b.warnings],
    };
}

async function pipelineToFile(stream: NodeJS.ReadableStream, destPath: string): Promise<void> {
    const fsSync = await import('fs');
    const { pipeline } = await import('stream/promises');
    await pipeline(stream, fsSync.createWriteStream(destPath));
}

async function unlinkSafe(filePath: string): Promise<void> {
    try { await fs.unlink(filePath); } catch { /* tolerate already-gone */ }
}

/**
 * Remove inspection temp files (`__inspect_*`) older than STALE_TEMP_MS from a
 * staging directory. Normal runs unlink their own temps; this reaps the ones a
 * crashed inspection left behind so they don't accumulate. Best-effort: any
 * read/stat/unlink error is tolerated.
 */
async function sweepStaleInspectTemps(dir: string): Promise<void> {
    let names: string[];
    try {
        names = await fs.readdir(dir);
    } catch {
        return;     // staging dir missing/unreadable — nothing to sweep
    }
    const now: number = Date.now();
    for (const name of names) {
        if (!name.startsWith(INSPECT_TEMP_PREFIX)) continue;
        const full: string = path.join(dir, name);
        try {
            const st = await fs.stat(full);
            if (now - st.mtimeMs > STALE_TEMP_MS) await fs.unlink(full);
        } catch { /* tolerate races / already-gone */ }
    }
}

// #endregion
