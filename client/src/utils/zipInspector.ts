/**
 * Zip inspector
 *
 * Client-side inspection of a dropped ZIP's table of contents to best-guess its
 * asset type before upload. Only the End-of-Central-Directory record and the
 * central directory are read (via Blob.slice) — payload data is never
 * decompressed — so a multi-gigabyte archive costs just a few small range reads.
 *
 * The resulting file list is fed to assessPackage() from @dpo-packrat/common, the
 * same classifier the server uses to gate uploads, keeping client and server in
 * agreement on how a package's contents map to an asset type.
 */
import { assessPackage, eVocabularyID } from '@dpo-packrat/common';

const EOCD_SIGNATURE = 0x06054b50;          // End of Central Directory
const EOCD64_LOCATOR_SIGNATURE = 0x07064b50; // ZIP64 EOCD locator
const EOCD64_SIGNATURE = 0x06064b50;        // ZIP64 End of Central Directory
const CDFH_SIGNATURE = 0x02014b50;          // Central Directory File Header

const EOCD_MIN_SIZE = 22;
const MAX_COMMENT_SIZE = 0xffff;
const ZIP64_MARKER = 0xffffffff;

async function readSlice(blob: Blob, start: number, end: number): Promise<DataView> {
    const buffer: ArrayBuffer = await blob.slice(start, end).arrayBuffer();
    return new DataView(buffer);
}

// Little-endian 64-bit read; ZIP sizes/offsets stay well within Number.MAX_SAFE_INTEGER.
function readUint64LE(view: DataView, offset: number): number {
    const low: number = view.getUint32(offset, true);
    const high: number = view.getUint32(offset + 4, true);
    return high * 0x100000000 + low;
}

function decodeName(bytes: Uint8Array): string {
    try {
        // Filenames are overwhelmingly ASCII; decoding legacy CP437 entries as UTF-8
        // still preserves the ASCII bytes we key the extension classification off of.
        return new TextDecoder('utf-8').decode(bytes);
    } catch {
        let name: string = '';
        for (let i = 0; i < bytes.length; i++)
            name += String.fromCharCode(bytes[i]);
        return name;
    }
}

function parseCentralDirectory(view: DataView): string[] {
    const names: string[] = [];
    const total: number = view.byteLength;
    let pos: number = 0;

    while (pos + 46 <= total) {
        if (view.getUint32(pos, true) !== CDFH_SIGNATURE)
            break;

        const nameLength: number = view.getUint16(pos + 28, true);
        const extraLength: number = view.getUint16(pos + 30, true);
        const commentLength: number = view.getUint16(pos + 32, true);
        const nameStart: number = pos + 46;

        if (nameStart + nameLength > total)
            break;

        const nameBytes: Uint8Array = new Uint8Array(view.buffer, view.byteOffset + nameStart, nameLength);
        names.push(decodeName(nameBytes));

        pos = nameStart + nameLength + extraLength + commentLength;
    }

    return names;
}

/**
 * Reads the file-name list from a ZIP blob's central directory. Returns [] if the
 * blob is not a parseable ZIP or on any read/parse error — callers treat an empty
 * list as "no confident guess".
 */
export async function readZipFileList(blob: Blob): Promise<string[]> {
    try {
        const size: number = blob.size;
        if (size < EOCD_MIN_SIZE)
            return [];

        // The EOCD sits at the tail, after an optional comment of up to 64KB.
        const tailLength: number = Math.min(size, EOCD_MIN_SIZE + MAX_COMMENT_SIZE);
        const tailStart: number = size - tailLength;
        const tail: DataView = await readSlice(blob, tailStart, size);

        let eocd: number = -1;
        for (let i = tailLength - EOCD_MIN_SIZE; i >= 0; i--) {
            if (tail.getUint32(i, true) === EOCD_SIGNATURE) {
                eocd = i;
                break;
            }
        }
        if (eocd < 0)
            return [];

        let cdSize: number = tail.getUint32(eocd + 12, true);
        let cdOffset: number = tail.getUint32(eocd + 16, true);
        let entryCount: number = tail.getUint16(eocd + 10, true);

        // Fall through to the ZIP64 records when any field is saturated (archive
        // larger than 4GB or with more than 65535 entries).
        if (cdOffset === ZIP64_MARKER || cdSize === ZIP64_MARKER || entryCount === 0xffff) {
            const locatorPos: number = eocd - 20;
            if (locatorPos >= 0 && tail.getUint32(locatorPos, true) === EOCD64_LOCATOR_SIGNATURE) {
                const eocd64Offset: number = readUint64LE(tail, locatorPos + 8);
                const eocd64: DataView = await readSlice(blob, eocd64Offset, eocd64Offset + 56);
                if (eocd64.getUint32(0, true) === EOCD64_SIGNATURE) {
                    entryCount = readUint64LE(eocd64, 32);
                    cdSize = readUint64LE(eocd64, 40);
                    cdOffset = readUint64LE(eocd64, 48);
                }
            }
        }

        if (cdSize <= 0 || cdOffset < 0 || cdOffset + cdSize > size)
            return [];

        const centralDirectory: DataView = await readSlice(blob, cdOffset, cdOffset + cdSize);
        return parseCentralDirectory(centralDirectory);
    } catch {
        return [];
    }
}

// Mirrors the server's noise filtering so macOS resource-fork/metadata entries do
// not skew the extension-based classification.
function isNoiseEntry(path: string): boolean {
    if (path.includes('__MACOSX/'))
        return true;
    const base: string = path.substring(path.lastIndexOf('/') + 1);
    return base === '.DS_Store' || base.startsWith('._');
}

// Photogrammetry variant folder names, mirroring the folder-name cases the server
// recognizes in VocabularyCache.mapPhotogrammetryVariantType (extension-derived
// tokens like cr2/tif/jpg are excluded — only names that appear as folders). Keys
// are lower-cased with underscores stripped, matching that map's normalization.
const PHOTOGRAMMETRY_VARIANT_FOLDERS: ReadonlySet<string> = new Set<string>([
    'raw', 'processed', 'colcor', 'converted', 'masks', 'mask',
    'camera', 'fromcamera', 'from camera', 'camerajpg',
]);

function hasPhotogrammetryVariantFolder(files: string[]): boolean {
    for (const file of files) {
        const segments: string[] = file.split('/');
        // Inspect directory segments only, never the trailing file name.
        for (let i = 0; i < segments.length - 1; i++) {
            const folder: string = segments[i].toLowerCase().replace(/_/g, '');
            if (PHOTOGRAMMETRY_VARIANT_FOLDERS.has(folder))
                return true;
        }
    }
    return false;
}

/**
 * Best-guesses an asset type from a ZIP's internal file list using the shared
 * assessPackage classifier. Returns a single asset-type vocabulary enum, or null
 * when the contents remain ambiguous or unrecognized (caller defaults such cases
 * to Other).
 *
 * A bare image set is legitimately ambiguous between Photogrammetry and Volumetric
 * (an image stack could be either), so neither is chosen. When those images are
 * organized into photogrammetry variant folders (raw/processed/masks/…), that
 * layout disambiguates the package to Photogrammetry.
 */
export function guessAssetTypeFromZipList(files: string[]): eVocabularyID | null {
    const meaningful: string[] = files.filter(file => !file.endsWith('/') && !isNoiseEntry(file));
    if (!meaningful.length)
        return null;

    const { possibleTypes } = assessPackage(meaningful);
    if (possibleTypes.size === 1)
        return Array.from(possibleTypes)[0];

    const photogrammetry = eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry;
    const volumetric = eVocabularyID.eAssetAssetTypeCaptureDataSetVolumetric;
    if (possibleTypes.has(photogrammetry) && possibleTypes.has(volumetric) && hasPhotogrammetryVariantFolder(meaningful))
        return photogrammetry;

    return null;
}
