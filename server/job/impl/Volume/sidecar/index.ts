/**
 * Sidecar parser pipeline for volumetric uploads.
 *
 * Vendor scan logs and config files (e.g. `.pca`, `.pcr`) hold the machine-readable scan
 * parameters we use to pre-fill the ingestion form. Each parser is a stage that fills a shared
 * normalized {@link SidecarParseResult}; the stages run in order over all sidecar files present.
 *
 * The order matters: the `.pca` (acquisition) stage runs first and supplies X-ray source
 * settings, scanner, and an acquisition voxel size; the `.pcr` (reconstruction) stage runs
 * second and is authoritative for the reconstructed volume (final voxel size, volume
 * dimensions, slice count), overriding the acquisition voxel size where both exist.
 *
 * Add a new file format by implementing {@link ISidecarParser}, exporting it, and registering it
 * in `SIDECAR_PARSERS` in the order it should run. Vendor-specific layouts of a given format are
 * handled inside that format's parser (see `pca.ts` / `pcr.ts`).
 */
import * as path from 'path';
import { PcaSidecarParser } from './pca';
import { PcrSidecarParser } from './pcr';

export interface SidecarParseResult {
    voxelSizeX?: number;
    voxelSizeY?: number;
    voxelSizeZ?: number;
    voxelSizeUnit?: 'Micrometer' | 'Millimeter';
    voltageKV?: number;
    amperageUA?: number;
    scannerMakeModel?: string;
    // Used for cross-checking against ZIP inventory in Stage 5.
    declaredSliceCount?: number;
    declaredDimensionsX?: number;
    declaredDimensionsY?: number;
    warnings: string[];
}

/** A single sidecar file to feed through the pipeline. */
export interface SidecarFile {
    path: string;
    name: string;
}

export interface ISidecarParser {
    canHandle(fileName: string): boolean;
    /** Fill the shared accumulator with whatever this file provides, returning the same object. */
    parse(filePath: string, acc: SidecarParseResult): Promise<SidecarParseResult>;
}

// Ordered: acquisition (.pca) first, reconstruction (.pcr) second.
const SIDECAR_PARSERS: ISidecarParser[] = [
    new PcaSidecarParser(),
    new PcrSidecarParser(),
];

/**
 * Run every sidecar file through the ordered parser stages, threading one shared accumulator.
 * Stage order (not file order) determines precedence, so a `.pca` is always applied before a
 * `.pcr` regardless of how the files were listed in the archive.
 */
export async function parseSidecars(files: SidecarFile[]): Promise<SidecarParseResult> {
    const acc: SidecarParseResult = { warnings: [] };
    for (const parser of SIDECAR_PARSERS) {
        for (const file of files) {
            if (parser.canHandle(file.name))
                await parser.parse(file.path, acc);
        }
    }
    return acc;
}

/**
 * Returns true when any registered parser would handle this filename. Used by the inspection job
 * to identify sidecar candidates from a ZIP's central directory.
 */
export function isSidecarFile(fileName: string): boolean {
    return SIDECAR_PARSERS.some(p => p.canHandle(path.basename(fileName)));
}
