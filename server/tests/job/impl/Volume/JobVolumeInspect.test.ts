/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * JobVolumeInspect unit tests — exercise the standalone inspection pipeline
 * against pre-generated synthesized fixtures. The DB / workflow lifecycle is
 * NOT exercised here; those layers are covered by integration testing when
 * Phase 4 ingestion lands.
 */
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { inspectVolumeZip } from '../../../../job/impl/Volume/JobVolumeInspect';
import { VolumeExtractedMetadata } from '../../../../job/impl/Volume/JobVolumeInspectOutput';
import { PcaSidecarParser } from '../../../../job/impl/Volume/sidecar/pca';
import { DicomInspector } from '../../../../job/impl/Volume/dicom/DicomInspector';

const FIXTURE_DIR: string = path.resolve(__dirname, '../../../fixtures/volume');

let tempStaging: string;

beforeAll(async () => {
    tempStaging = await fs.mkdtemp(path.join(os.tmpdir(), 'volume-inspect-test-'));
});

afterAll(async () => {
    if (!tempStaging) return;
    // Best-effort cleanup. On Windows, sharp/exiftool can briefly hold file
    // handles after parse — a rmdir race we don't care about. OS tmpdir is
    // self-cleaning.
    try {
        await fs.rm(tempStaging, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch {
        // intentional: leave the temp dir for the OS to reap
    }
});

/** Copy a fixture into the test's temp staging dir; inspectVolumeZip extracts samples here. */
async function stageFixture(name: string): Promise<string> {
    const src: string = path.join(FIXTURE_DIR, name);
    const dest: string = path.join(tempStaging, name);
    await fs.copyFile(src, dest);
    return dest;
}

describe('JobVolumeInspect — sidecar parser', () => {
    test('PcaSidecarParser reads voxel size, voltage, scanner from .pca', async () => {
        const parser: PcaSidecarParser = new PcaSidecarParser();
        expect(parser.canHandle('scan.pca')).toBe(true);
        expect(parser.canHandle('scan.txt')).toBe(false);

        const fixturePath: string = path.join(FIXTURE_DIR, 'volume-test.pca');
        const result = await parser.parse(fixturePath);
        expect(result.voxelSizeX).toBe(25);                  // 0.025 mm → 25 µm
        expect(result.voxelSizeY).toBe(25);
        expect(result.voxelSizeZ).toBe(25);
        expect(result.voxelSizeUnit).toBe('Micrometer');
        expect(result.voltageKV).toBe(100);
        expect(result.amperageUA).toBe(200000);              // 200 mA → 200000 µA
        expect(result.scannerMakeModel).toContain('PackratTest');
        expect(result.declaredSliceCount).toBe(4);
        expect(result.declaredDimensionsX).toBe(16);
        expect(result.declaredDimensionsY).toBe(16);
    });

    test('PcaSidecarParser tolerates unknown keys with warnings', async () => {
        const parser: PcaSidecarParser = new PcaSidecarParser();
        const tempFile: string = path.join(tempStaging, 'unknown.pca');
        await fs.writeFile(tempFile, '[Foo]\nWidget Count = 7\nImage Pixel Size (um) = 12\n');
        const result = await parser.parse(tempFile);
        expect(result.voxelSizeX).toBe(12);
        expect(result.warnings.some(w => w.includes('widgetcount'))).toBe(true);
    });
});

describe('JobVolumeInspect — DICOM inspector', () => {
    test('DicomInspector reads expected tags from synthesized DICOM', async () => {
        // Use the existing fixture but extract a single instance to disk first.
        const fs2 = await import('fs');
        const jszipMod = await import('jszip');
        const JSZip = jszipMod.default;
        const zipBuf: Buffer = fs2.readFileSync(path.join(FIXTURE_DIR, 'volume-test-dicom.zip'));
        const zip = await JSZip.loadAsync(zipBuf);
        const dcmName: string | undefined = Object.keys(zip.files).find(n => n.endsWith('.dcm'));
        expect(dcmName).toBeTruthy();
        const entry = dcmName ? zip.file(dcmName) : null;
        expect(entry).toBeTruthy();
        const dcmBuf: Buffer = await entry!.async('nodebuffer'); // eslint-disable-line @typescript-eslint/no-non-null-assertion

        const dcmPath: string = path.join(tempStaging, 'one.dcm');
        await fs.writeFile(dcmPath, dcmBuf);

        const inspect = await DicomInspector.inspectFile(dcmPath);
        expect(inspect.rows).toBe(16);
        expect(inspect.columns).toBe(16);
        expect(inspect.bitsAllocated).toBe(8);
        expect(inspect.voltageKV).toBe(100);
        expect(inspect.tubeCurrentMA).toBe(200);
        expect(inspect.pixelSpacingRow).toBeCloseTo(0.025, 6);
        expect(inspect.pixelSpacingColumn).toBeCloseTo(0.025, 6);
        expect(inspect.sliceThicknessMM).toBeCloseTo(0.025, 6);
        expect(inspect.manufacturer).toBe('PackratTest');
        expect(inspect.manufacturerModelName).toBe('SyntheticCT-1');
    });
});

describe('JobVolumeInspect — TIFF stack', () => {
    test('TIFF stack ZIP populates contentType, fileCount, sliceCount, dimensions, bitDepth', async () => {
        const zipPath: string = await stageFixture('volume-test-tiff.zip');
        const md: VolumeExtractedMetadata = await inspectVolumeZip(zipPath, tempStaging);

        expect(md.contentType).toBe('TIFF_STACK');
        expect(md.fileCount).toBe(4);
        expect(md.sliceCount).toBe(4);
        expect(md.dimensionsX).toBe(16);
        expect(md.dimensionsY).toBe(16);
        expect(md.dimensionsZ).toBe(4);
        expect(md.bitDepth).toBe(8);
        expect(md.scanSheetPaths).toEqual([]);
        expect(md.scanLogPaths).toEqual([]);
        expect(md.vendorSidecarPaths).toEqual([]);
    });
});

describe('JobVolumeInspect — DICOM series', () => {
    test('DICOM ZIP populates contentType + dimensions + scan parameters from first instance', async () => {
        const zipPath: string = await stageFixture('volume-test-dicom.zip');
        const md: VolumeExtractedMetadata = await inspectVolumeZip(zipPath, tempStaging);

        expect(md.contentType).toBe('DICOM');
        expect(md.fileCount).toBe(4);
        expect(md.sliceCount).toBe(4);
        expect(md.dimensionsX).toBe(16);
        expect(md.dimensionsY).toBe(16);
        expect(md.dimensionsZ).toBe(4);
        expect(md.bitDepth).toBe(8);
        expect(md.voxelSizeUnit).toBe('Millimeter');
        expect(md.voxelSizeX).toBeCloseTo(0.025, 6);
        expect(md.voxelSizeY).toBeCloseTo(0.025, 6);
        expect(md.voxelSizeZ).toBeCloseTo(0.025, 6);
        expect(md.voltageKV).toBe(100);
        expect(md.amperageUA).toBe(200000);                // 200 mA → 200000 µA
        expect(md.scannerMakeModel).toContain('PackratTest');
    });
});

describe('JobVolumeInspect — sidecar in ZIP', () => {
    test('.pca sidecar inside ZIP populates voxel size, voltage, scanner', async () => {
        const zipPath: string = await stageFixture('volume-test-with-pca.zip');
        const md: VolumeExtractedMetadata = await inspectVolumeZip(zipPath, tempStaging);

        expect(md.contentType).toBe('TIFF_STACK');
        expect(md.fileCount).toBe(5);                       // 4 slices + 1 .pca
        expect(md.sliceCount).toBe(4);
        expect(md.vendorSidecarPaths.length).toBe(1);
        expect(md.vendorSidecarPaths[0]).toContain('.pca');
        // sidecar fields override / supply where header doesn't:
        expect(md.voxelSizeX).toBe(25);                     // .pca says 25 µm
        expect(md.voxelSizeUnit).toBe('Micrometer');
        expect(md.voltageKV).toBe(100);
        expect(md.scannerMakeModel).toContain('PackratTest');
    });
});

describe('JobVolumeInspect — fatal failure paths', () => {
    test('Malformed ZIP fails Stage 1', async () => {
        const zipPath: string = await stageFixture('volume-test-malformed.zip');
        await expect(inspectVolumeZip(zipPath, tempStaging)).rejects.toThrow(/Stage 1/);
    });

    test('Cross-check failure: .pca declares wrong slice count', async () => {
        const zipPath: string = await stageFixture('volume-test-pca-mismatch.zip');
        await expect(inspectVolumeZip(zipPath, tempStaging)).rejects.toThrow(/Stage 5|cross-check/i);
    });
});
