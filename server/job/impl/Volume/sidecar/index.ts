/**
 * Sidecar parser dispatcher for volumetric uploads.
 *
 * Vendor scan logs and config files (e.g. .pca, .xtekct, .vgi) hold the
 * machine-readable scan parameters we use to pre-fill the ingestion form.
 * Add new formats by implementing `ISidecarParser`, exporting it, and
 * registering in `SIDECAR_PARSERS` below. The single entry point
 * `parseSidecar(filePath)` picks the right parser by extension.
 *
 * Phase 2 ships `.pca` only. xtekct and vgi follow in later PRs.
 */
import * as path from 'path';
import { PcaSidecarParser } from './pca';

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

export interface ISidecarParser {
    canHandle(fileName: string): boolean;
    parse(filePath: string): Promise<SidecarParseResult>;
}

const SIDECAR_PARSERS: ISidecarParser[] = [
    new PcaSidecarParser(),
];

/**
 * Dispatch to the appropriate sidecar parser for a given file. Returns
 * `null` when no registered parser handles the extension.
 */
export async function parseSidecar(filePath: string): Promise<SidecarParseResult | null> {
    const fileName: string = path.basename(filePath);
    const parser: ISidecarParser | undefined = SIDECAR_PARSERS.find(p => p.canHandle(fileName));
    if (!parser)
        return null;
    return await parser.parse(filePath);
}

/**
 * Returns true when any registered parser would handle this filename.
 * Used by the inspection job to identify sidecar candidates from a ZIP's
 * central directory.
 */
export function isSidecarFile(fileName: string): boolean {
    return SIDECAR_PARSERS.some(p => p.canHandle(fileName));
}
