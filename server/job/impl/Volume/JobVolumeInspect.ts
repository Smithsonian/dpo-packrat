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
const DICOM_EXT_REGEX = /\.dcm$/i;

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

        // Stage 1: content-type detection
        const tiffEntries: string[] = fileEntries.filter(e => TIFF_EXT_REGEX.test(e)).sort();
        const dicomEntries: string[] = fileEntries.filter(e => DICOM_EXT_REGEX.test(e) || /DICOMDIR$/i.test(e)).sort();

        let contentType: VolumeContentType;
        if (tiffEntries.length > 0) contentType = 'TIFF_STACK';
        else if (dicomEntries.length > 0) contentType = 'DICOM';
        else contentType = 'OTHER';

        if (contentType === 'OTHER')
            throw new Error('Stage 1 (archive pre-flight): no TIFF slices or DICOM instances found — user selected Volumetric but ZIP contains no recognizable scan data');

        // Stage 2: file inventory
        const sliceEntries: string[] = contentType === 'TIFF_STACK' ? tiffEntries : dicomEntries;
        const sliceCount: number = sliceEntries.length;
        const fileCount: number = fileEntries.length;
        const warnings: string[] = [];

        // Duplicate-filename detection (different paths, same basename)
        const seenNames = new Map<string, number>();
        for (const entry of fileEntries) {
            const base: string = path.basename(entry).toLowerCase();
            seenNames.set(base, (seenNames.get(base) ?? 0) + 1);
        }
        for (const [name, count] of seenNames)
            if (count > 1)
                warnings.push(`Duplicate filename appears ${count}x: ${name}`);

        // Sequence-numbering continuity (warn-only)
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

        // Stage 5: cross-check + companion file tagging
        if (sidecarResult.declaredSliceCount !== undefined && sidecarResult.declaredSliceCount !== sliceCount)
            throw new Error(`Stage 5 (cross-check): sidecar declares ${sidecarResult.declaredSliceCount} slices but ZIP contains ${sliceCount}`);
        if (sidecarResult.declaredDimensionsX !== undefined && headerData.dimensionsX !== undefined
            && sidecarResult.declaredDimensionsX !== headerData.dimensionsX)
            throw new Error(`Stage 5 (cross-check): sidecar declares dimensionsX=${sidecarResult.declaredDimensionsX} but header reports ${headerData.dimensionsX}`);
        if (sidecarResult.declaredDimensionsY !== undefined && headerData.dimensionsY !== undefined
            && sidecarResult.declaredDimensionsY !== headerData.dimensionsY)
            throw new Error(`Stage 5 (cross-check): sidecar declares dimensionsY=${sidecarResult.declaredDimensionsY} but header reports ${headerData.dimensionsY}`);

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
            if (contentType === 'TIFF_STACK') {
                const sample: HeaderSampleData = await sampleTiff(tempPath, warnings);
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

/** Warn-only check that slice filenames have a numeric component that increments without gaps. */
function checkSequenceContinuity(sliceEntries: string[], warnings: string[]): void {
    const numbers: number[] = [];
    for (const entry of sliceEntries) {
        const match: RegExpMatchArray | null = path.basename(entry).match(/(\d+)(?=\.[^.]+$)/);
        if (match) numbers.push(parseInt(match[1], 10));
    }
    if (numbers.length < 2) return;
    numbers.sort((a, b) => a - b);
    for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] !== numbers[i - 1] + 1) {
            warnings.push(`Slice sequence has gap between ${numbers[i - 1]} and ${numbers[i]}`);
            return;
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

async function sampleTiff(filePath: string, warnings: string[]): Promise<HeaderSampleData> {
    const extractor: MetadataExtractor = new MetadataExtractor();
    const result: H.IOResults = await extractor.extractMetadata(filePath);
    if (!result.success) {
        warnings.push(`TIFF header parse failed: ${result.error}`);
        return {};
    }

    const md: Map<string, string> = extractor.metadata;
    const data: HeaderSampleData = {};
    data.dimensionsX = readPositiveInt(md, ['ImageWidth', 'imagewidth']);
    data.dimensionsY = readPositiveInt(md, ['ImageHeight', 'ImageLength', 'imageheight', 'imagelength']);
    data.bitDepth = readPositiveInt(md, ['BitsPerSample', 'bitspersample']);
    return data;
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

// #endregion
