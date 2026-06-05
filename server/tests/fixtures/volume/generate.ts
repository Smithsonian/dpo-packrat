/**
 * Volume test fixture generator.
 *
 * Run manually with: yarn ts-node server/tests/fixtures/volume/generate.ts
 * Produces:
 *   - volume-test-tiff.zip       4× 16×16 grayscale 8-bit TIFF stack
 *   - volume-test-dicom.zip      4× minimal DICOM instances (16×16 8-bit) with known headers
 *   - volume-test.pca            Plain-text key/value sidecar
 *   - volume-test-malformed.zip  Garbage bytes (not a valid ZIP)
 *   - volume-test-with-pca.zip   TIFF stack + .pca sidecar inside
 *   - volume-test-pca-mismatch.zip TIFF stack + .pca with sliceCount that contradicts ZIP
 *
 * These files are committed to the repo. Regenerate only if a fixture must change.
 * Not part of CI.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import JSZip from 'jszip';

const OUT_DIR = __dirname;

const SLICE_COUNT = 4;
const SLICE_WIDTH = 16;
const SLICE_HEIGHT = 16;
const SLICE_BIT_DEPTH = 8;

const DICOM_VOLTAGE_KV = 100;
const DICOM_TUBE_CURRENT_MA = 200;
const DICOM_PIXEL_SPACING_MM = 0.025;
const DICOM_SLICE_THICKNESS_MM = 0.025;
const DICOM_MANUFACTURER = 'PackratTest';
const DICOM_MODEL = 'SyntheticCT-1';
const DICOM_MODALITY = 'CT';

async function main(): Promise<void> {
    await fs.mkdir(OUT_DIR, { recursive: true });

    await writeTiffStackZip(path.join(OUT_DIR, 'volume-test-tiff.zip'));
    await writeDicomZip(path.join(OUT_DIR, 'volume-test-dicom.zip'));
    await writePcaFile(path.join(OUT_DIR, 'volume-test.pca'));
    await writeMalformedZip(path.join(OUT_DIR, 'volume-test-malformed.zip'));
    await writeTiffWithPcaZip(path.join(OUT_DIR, 'volume-test-with-pca.zip'), SLICE_COUNT, false);
    await writeTiffWithPcaZip(path.join(OUT_DIR, 'volume-test-pca-mismatch.zip'), SLICE_COUNT + 6, true);

    console.log('Generated fixtures in', OUT_DIR);
}

async function writeTiffStackZip(outPath: string): Promise<void> {
    const zip = new JSZip();
    for (let i = 0; i < SLICE_COUNT; i++) {
        const buf: Buffer = await makeTiffSlice(i);
        zip.file(`slice_${pad(i, 4)}.tif`, buf);
    }
    const data: Buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    await fs.writeFile(outPath, data);
}

async function writeDicomZip(outPath: string): Promise<void> {
    const zip = new JSZip();
    for (let i = 0; i < SLICE_COUNT; i++) {
        const buf: Buffer = makeDicomInstance();
        zip.file(`slice_${pad(i, 4)}.dcm`, buf);
    }
    const data: Buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    await fs.writeFile(outPath, data);
}

async function writePcaFile(outPath: string): Promise<void> {
    const lines: string[] = [
        '[Scan]',
        `Image Pixel Size (um) = ${DICOM_PIXEL_SPACING_MM * 1000}`,
        `Source Voltage (kV)   = ${DICOM_VOLTAGE_KV}`,
        `Source Current (uA)   = ${DICOM_TUBE_CURRENT_MA * 1000}`,
        `Scanner = ${DICOM_MANUFACTURER} ${DICOM_MODEL}`,
        `Number of Files = ${SLICE_COUNT}`,
        `Number of Rows = ${SLICE_HEIGHT}`,
        `Number of Columns = ${SLICE_WIDTH}`,
        '',
    ];
    await fs.writeFile(outPath, lines.join('\r\n'), 'utf-8');
}

async function writeMalformedZip(outPath: string): Promise<void> {
    // Not a valid ZIP — random bytes will fail node-stream-zip's open.
    const buf: Buffer = Buffer.from('not-a-zip-file-just-some-random-bytes\nasdf\n');
    await fs.writeFile(outPath, buf);
}

async function writeTiffWithPcaZip(outPath: string, declaredSliceCount: number, isMismatch: boolean): Promise<void> {
    const zip = new JSZip();
    for (let i = 0; i < SLICE_COUNT; i++) {
        const buf: Buffer = await makeTiffSlice(i);
        zip.file(`slice_${pad(i, 4)}.tif`, buf);
    }
    const pca: string = [
        '[Scan]',
        `Image Pixel Size (um) = ${DICOM_PIXEL_SPACING_MM * 1000}`,
        `Source Voltage (kV)   = ${DICOM_VOLTAGE_KV}`,
        `Source Current (uA)   = ${DICOM_TUBE_CURRENT_MA * 1000}`,
        `Scanner = ${DICOM_MANUFACTURER} ${DICOM_MODEL}`,
        `Number of Files = ${declaredSliceCount}`,
        '',
    ].join('\r\n');
    zip.file(isMismatch ? 'mismatch.pca' : 'scan.pca', pca);
    const data: Buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    await fs.writeFile(outPath, data);
}

async function makeTiffSlice(sliceIndex: number): Promise<Buffer> {
    // Solid-gray slice; the actual pixel content does not matter — only headers do.
    const intensity: number = 32 + sliceIndex * 32;       // varies across slices for sanity
    const raw: Buffer = Buffer.alloc(SLICE_WIDTH * SLICE_HEIGHT, intensity);
    return await sharp(raw, {
        raw: { width: SLICE_WIDTH, height: SLICE_HEIGHT, channels: 1 },
    }).tiff({ bitdepth: SLICE_BIT_DEPTH }).toBuffer();
}

function pad(n: number, width: number): string {
    return String(n).padStart(width, '0');
}

// -------------------------------------------------------------------
// Minimal DICOM Part-10 writer for one instance.
// Explicit VR Little Endian (1.2.840.10008.1.2.1).
// Encodes only the tags we read in DicomInspector.
// -------------------------------------------------------------------

function makeDicomInstance(): Buffer {
    // Build dataset (Explicit VR LE)
    const datasetParts: Buffer[] = [
        encodeShortVR(0x0008, 0x0060, 'CS', strBytes(DICOM_MODALITY)),
        encodeShortVR(0x0008, 0x0070, 'LO', strBytes(DICOM_MANUFACTURER)),
        encodeShortVR(0x0008, 0x1090, 'LO', strBytes(DICOM_MODEL)),
        encodeShortVR(0x0018, 0x0050, 'DS', strBytes(formatNumber(DICOM_SLICE_THICKNESS_MM))),
        encodeShortVR(0x0018, 0x0060, 'DS', strBytes(formatNumber(DICOM_VOLTAGE_KV))),
        encodeShortVR(0x0018, 0x1151, 'IS', strBytes(String(DICOM_TUBE_CURRENT_MA))),
        encodeShortVR(0x0028, 0x0010, 'US', uint16Bytes(SLICE_HEIGHT)),                   // Rows
        encodeShortVR(0x0028, 0x0011, 'US', uint16Bytes(SLICE_WIDTH)),                    // Columns
        encodeShortVR(0x0028, 0x0030, 'DS', strBytes(`${formatNumber(DICOM_PIXEL_SPACING_MM)}\\${formatNumber(DICOM_PIXEL_SPACING_MM)}`)),
        encodeShortVR(0x0028, 0x0100, 'US', uint16Bytes(SLICE_BIT_DEPTH)),                // BitsAllocated
    ];
    const dataset: Buffer = Buffer.concat(datasetParts);

    // Build meta header (Explicit VR LE; the meta group is always so encoded)
    const transferSyntax: string = '1.2.840.10008.1.2.1';                                  // Explicit VR LE
    const sopClass: string = '1.2.840.10008.5.1.4.1.1.2';                                  // CT Image Storage
    const sopInstance: string = '1.2.3.4.5.6.7.8.9';
    const implClassUID: string = '1.2.826.0.1.3680043.9.7100.1';

    const metaBody: Buffer = Buffer.concat([
        encodeShortVR(0x0002, 0x0001, 'OB', Buffer.from([0x00, 0x01])),                    // FileMetaInformationVersion (we use short VR for simplicity; ok for this fixture)
        encodeShortVR(0x0002, 0x0002, 'UI', strBytes(sopClass)),
        encodeShortVR(0x0002, 0x0003, 'UI', strBytes(sopInstance)),
        encodeShortVR(0x0002, 0x0010, 'UI', strBytes(transferSyntax)),
        encodeShortVR(0x0002, 0x0012, 'UI', strBytes(implClassUID)),
    ]);
    const metaHeader: Buffer = Buffer.concat([
        encodeShortVR(0x0002, 0x0000, 'UL', uint32Bytes(metaBody.length)),                 // FileMetaInformationGroupLength
        metaBody,
    ]);

    const preamble: Buffer = Buffer.alloc(128, 0);
    const magic: Buffer = Buffer.from('DICM', 'ascii');

    return Buffer.concat([preamble, magic, metaHeader, dataset]);
}

function encodeShortVR(group: number, element: number, vr: string, value: Buffer): Buffer {
    // Pad value to even length per DICOM rules
    const padded: Buffer = value.length % 2 === 0 ? value : Buffer.concat([value, Buffer.from([0x00])]);

    // VR codes that use the "long" encoding (4-byte length, 2-byte reserved):
    const LONG_VRS = ['OB', 'OW', 'OF', 'SQ', 'UT', 'UN'];

    if (LONG_VRS.includes(vr)) {
        const header: Buffer = Buffer.alloc(12);
        header.writeUInt16LE(group, 0);
        header.writeUInt16LE(element, 2);
        header.write(vr, 4, 2, 'ascii');
        // reserved bytes 6,7 = 0x0000
        header.writeUInt32LE(padded.length, 8);
        return Buffer.concat([header, padded]);
    } else {
        const header: Buffer = Buffer.alloc(8);
        header.writeUInt16LE(group, 0);
        header.writeUInt16LE(element, 2);
        header.write(vr, 4, 2, 'ascii');
        header.writeUInt16LE(padded.length, 6);
        return Buffer.concat([header, padded]);
    }
}

function strBytes(s: string): Buffer { return Buffer.from(s, 'ascii'); }
function uint16Bytes(n: number): Buffer { const b = Buffer.alloc(2); b.writeUInt16LE(n & 0xffff, 0); return b; }
function uint32Bytes(n: number): Buffer { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0, 0); return b; }
function formatNumber(n: number): string { return n.toFixed(6).replace(/\.?0+$/, ''); }

main().catch(err => {
    console.error('Fixture generation failed:', err);
    process.exit(1);
});
