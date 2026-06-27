/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * JobVolumeInspect unit tests — exercise the standalone inspection pipeline
 * against pre-generated synthesized fixtures. The DB / workflow lifecycle is
 * NOT exercised here; it's covered by integration tests against the ingest
 * mutation that wires this into the upload pipeline.
 */
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { inspectVolumeZip } from '../../../../job/impl/Volume/JobVolumeInspect';
import { VolumeExtractedMetadata } from '../../../../job/impl/Volume/JobVolumeInspectOutput';
import { PcaSidecarParser } from '../../../../job/impl/Volume/sidecar/pca';
import { PcrSidecarParser } from '../../../../job/impl/Volume/sidecar/pcr';
import { parseSidecars } from '../../../../job/impl/Volume/sidecar';
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
        const result = await parser.parse(fixturePath, { warnings: [] });
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
        const result = await parser.parse(tempFile, { warnings: [] });
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

        expect(md.contentType).toBe('IMAGE_STACK');
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
        expect(md.modality).toBe('CT');                    // DICOM (0008,0060)
    });
});

describe('JobVolumeInspect — sidecar in ZIP', () => {
    test('.pca sidecar inside ZIP populates voxel size, voltage, amperage, scanner', async () => {
        const zipPath: string = await stageFixture('volume-test-with-pca.zip');
        const md: VolumeExtractedMetadata = await inspectVolumeZip(zipPath, tempStaging);

        expect(md.contentType).toBe('IMAGE_STACK');
        expect(md.fileCount).toBe(5);                       // 4 slices + 1 .pca
        expect(md.sliceCount).toBe(4);
        expect(md.vendorSidecarPaths.length).toBe(1);
        expect(md.vendorSidecarPaths[0]).toContain('.pca');
        // sidecar fields override / supply where header doesn't:
        expect(md.voxelSizeX).toBe(25);                     // .pca says 25 µm
        expect(md.voxelSizeUnit).toBe('Micrometer');
        expect(md.voltageKV).toBe(100);
        expect(md.amperageUA).toBe(200000);                 // .pca says 200 mA → 200000 µA
        expect(md.scannerMakeModel).toContain('PackratTest');
    });
});

describe('ZipFile.getEntryMetadata', () => {
    test('returns { size, compressedSize } for a known entry', async () => {
        const { ZipFile } = await import('../../../../utils/zipFile');
        const zip = new ZipFile(path.join(FIXTURE_DIR, 'volume-test-tiff.zip'));
        const load = await zip.load();
        expect(load.success).toBe(true);
        try {
            const files = await zip.getJustFiles(null);
            expect(files.length).toBeGreaterThan(0);
            const md = await zip.getEntryMetadata(files[0]);
            expect(md).toBeTruthy();
            if (md) {
                expect(md.size).toBeGreaterThan(0);
                expect(md.compressedSize).toBeGreaterThanOrEqual(0);
            }
        } finally {
            await zip.close();
        }
    });

    test('returns null for an unknown entry', async () => {
        const { ZipFile } = await import('../../../../utils/zipFile');
        const zip = new ZipFile(path.join(FIXTURE_DIR, 'volume-test-tiff.zip'));
        const load = await zip.load();
        expect(load.success).toBe(true);
        try {
            const md = await zip.getEntryMetadata('does-not-exist.tif');
            expect(md).toBeNull();
        } finally {
            await zip.close();
        }
    });
});

describe('JobVolumeInspect — fatal failure paths', () => {
    test('Malformed ZIP fails Stage 1', async () => {
        const zipPath: string = await stageFixture('volume-test-malformed.zip');
        await expect(inspectVolumeZip(zipPath, tempStaging)).rejects.toThrow(/Stage 1/);
    });

    test('Cross-check mismatch: a sidecar slice count that contradicts the ZIP fails inspection', async () => {
        const zipPath: string = await stageFixture('volume-test-pca-mismatch.zip');
        // The .pca declares more slices than the ZIP holds — a data-integrity conflict, now fatal.
        await expect(inspectVolumeZip(zipPath, tempStaging)).rejects.toThrow(/integrity check failed/i);
    });
});

describe('JobVolumeInspect — integrity conflicts are fatal', () => {
    test('PCR declared slice count that differs from the actual count fails inspection', async () => {
        const JSZip = (await import('jszip')).default;
        const fss = await import('fs');
        const dicomZipBuf: Buffer = fss.readFileSync(path.join(FIXTURE_DIR, 'volume-test-dicom.zip'));
        const zip = await JSZip.loadAsync(dicomZipBuf);
        // 4 DICOM slices in the ZIP, but the .pcr declares 2023 reconstructed slices.
        zip.file('scan.pcr', '[VolumeData]\nVolume_SizeX=16\nVolume_SizeY=16\nVolume_SizeZ=2023\nVoxelSizeRec=0.1\n');
        const outBuf: Buffer = await zip.generateAsync({ type: 'nodebuffer' });
        const zipPath: string = path.join(tempStaging, 'dicom-pcr-count-mismatch.zip');
        await fs.writeFile(zipPath, outBuf);

        await expect(inspectVolumeZip(zipPath, tempStaging)).rejects.toThrow(/integrity check failed/i);
    });

    test('a gap in the slice sequence (missing slice) fails inspection', async () => {
        const JSZip = (await import('jszip')).default;
        const fss = await import('fs');
        const dicomZipBuf: Buffer = fss.readFileSync(path.join(FIXTURE_DIR, 'volume-test-dicom.zip'));
        const src = await JSZip.loadAsync(dicomZipBuf);
        const names: string[] = Object.keys(src.files).filter(n => n.toLowerCase().endsWith('.dcm')).sort();
        // Re-pack the same instances under gapped names: 0,1,2,4 (slice 3 missing).
        const gapNames: string[] = ['slice_0000.dcm', 'slice_0001.dcm', 'slice_0002.dcm', 'slice_0004.dcm'];
        const gapZip = new JSZip();
        for (let i = 0; i < names.length; i++) {
            const data: Buffer = await src.file(names[i])!.async('nodebuffer'); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            gapZip.file(gapNames[i] ?? `slice_${String(i).padStart(4, '0')}.dcm`, data);
        }
        const outBuf: Buffer = await gapZip.generateAsync({ type: 'nodebuffer' });
        const zipPath: string = path.join(tempStaging, 'dicom-sequence-gap.zip');
        await fs.writeFile(zipPath, outBuf);

        await expect(inspectVolumeZip(zipPath, tempStaging)).rejects.toThrow(/integrity check failed/i);
    });
});

describe('JobVolumeInspect — GE Phoenix .pca (acquisition)', () => {
    test('reads voltage/current/scanner/voxel and ignores projection-domain keys', async () => {
        const parser: PcaSidecarParser = new PcaSidecarParser();
        const result = await parser.parse(path.join(FIXTURE_DIR, 'volume-test-phoenix.pca'), { warnings: [] });

        expect(result.voltageKV).toBe(210);                  // [Xray] Voltage, not [Warmup] kV (215)
        expect(result.voltageKV).not.toBe(215);
        expect(result.amperageUA).toBe(200);                 // [Xray] Current, µA native — no scaling
        expect(result.scannerMakeModel).toContain('Phoenix');
        expect(result.voxelSizeX).toBeCloseTo(0.0997555, 6);
        expect(result.voxelSizeY).toBeCloseTo(0.0997555, 6);
        expect(result.voxelSizeUnit).toBe('Millimeter');

        // [Image] DimX/DimY and [CT] NumberImages are projection/detector data — must NOT map to volume geometry
        expect(result.declaredDimensionsX).toBeUndefined();
        expect(result.declaredDimensionsY).toBeUndefined();
        expect(result.declaredSliceCount).toBeUndefined();
    });

    test('reads latin1-encoded scanner name (µ) without corruption', async () => {
        const parser: PcaSidecarParser = new PcaSidecarParser();
        const tmp: string = path.join(tempStaging, 'latin1.pca');
        const content: string = '[General]\nSystemName=Test µCT\n[Geometry]\nVoxelSizeX=0.1\n[Xray]\nVoltage=80\nCurrent=100\n';
        await fs.writeFile(tmp, Buffer.from(content, 'latin1'));
        const result = await parser.parse(tmp, { warnings: [] });
        expect(result.scannerMakeModel).toContain('µ');
    });
});

describe('JobVolumeInspect — GE Phoenix .pcr (reconstruction)', () => {
    test('reads reconstructed voxel size and volume dimensions/slice count', async () => {
        const parser: PcrSidecarParser = new PcrSidecarParser();
        const result = await parser.parse(path.join(FIXTURE_DIR, 'volume-test-phoenix.pcr'), { warnings: [] });

        expect(result.voxelSizeX).toBe(0.09975548833608627);
        expect(result.voxelSizeY).toBe(0.09975548833608627);
        expect(result.voxelSizeZ).toBe(0.09975548833608627);
        expect(result.voxelSizeUnit).toBe('Millimeter');
        expect(result.declaredDimensionsX).toBe(1820);
        expect(result.declaredDimensionsY).toBe(1318);
        expect(result.declaredSliceCount).toBe(2023);

        // .pcr references its .pca for source settings and does not carry them itself
        expect(result.voltageKV).toBeUndefined();
        expect(result.amperageUA).toBeUndefined();
    });
});

describe('JobVolumeInspect — sidecar pipeline (PCA + PCR)', () => {
    const pca = { path: path.join(FIXTURE_DIR, 'volume-test-phoenix.pca'), name: 'volume-test-phoenix.pca' };
    const pcr = { path: path.join(FIXTURE_DIR, 'volume-test-phoenix.pcr'), name: 'volume-test-phoenix.pcr' };

    test('merges acquisition + reconstruction; PCR is authoritative for reconstructed voxel', async () => {
        const merged = await parseSidecars([pca, pcr]);
        expect(merged.voltageKV).toBe(210);                  // PCA
        expect(merged.amperageUA).toBe(200);                 // PCA
        expect(merged.scannerMakeModel).toContain('Phoenix'); // PCA
        expect(merged.declaredDimensionsX).toBe(1820);       // PCR
        expect(merged.declaredSliceCount).toBe(2023);        // PCR
        expect(merged.voxelSizeX).toBe(0.09975548833608627); // PCR overrides PCA's 0.09975550
        expect(merged.voxelSizeZ).toBe(0.09975548833608627); // only PCR supplies Z
    });

    test('stage order is fixed (PCA before PCR) regardless of file order', async () => {
        const reversed = await parseSidecars([pcr, pca]);
        expect(reversed.voltageKV).toBe(210);
        expect(reversed.declaredSliceCount).toBe(2023);
        expect(reversed.voxelSizeX).toBe(0.09975548833608627);
    });
});

describe('JobVolumeInspect — header wins over sidecar for geometry', () => {
    test('DICOM header values take precedence over a conflicting sidecar', async () => {
        const JSZip = (await import('jszip')).default;
        const fss = await import('fs');
        const dicomZipBuf: Buffer = fss.readFileSync(path.join(FIXTURE_DIR, 'volume-test-dicom.zip'));
        const zip = await JSZip.loadAsync(dicomZipBuf);
        // Sidecar voxel (0.5 mm) and voltage (80) deliberately differ from the DICOM header
        // (0.025 mm, 100 kV) so we can prove the header wins.
        zip.file('scan.pca', '[General]\nSystemName=Sidecar Scanner\n[Geometry]\nVoxelSizeX=0.5\nVoxelSizeY=0.5\n[Xray]\nVoltage=80\nCurrent=150\n');
        const outBuf: Buffer = await zip.generateAsync({ type: 'nodebuffer' });
        const zipPath: string = path.join(tempStaging, 'dicom-with-pca.zip');
        await fs.writeFile(zipPath, outBuf);

        const md: VolumeExtractedMetadata = await inspectVolumeZip(zipPath, tempStaging);
        expect(md.contentType).toBe('DICOM');
        expect(md.voxelSizeX).toBeCloseTo(0.025, 6);         // DICOM PixelSpacing, not the sidecar's 0.5
        expect(md.voltageKV).toBe(100);                      // DICOM KVP, not the sidecar's 80
        expect(md.scannerMakeModel).toContain('PackratTest'); // DICOM manufacturer/model, not the sidecar
    });
});
