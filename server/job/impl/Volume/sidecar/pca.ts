/**
 * .pca sidecar parser.
 *
 * Format: INI-style with [Section] headers and `key=value` (or `key: value`)
 * pairs. Common scanner-vendor extension; Bruker SkyScan and similar emit
 * .pca files alongside CT reconstructions. Keys vary by scanner version
 * so unrecognized keys are warned, not errored.
 *
 * Recognized keys (case-insensitive, whitespace-tolerant):
 *   - "Image Pixel Size (um)" → voxelSizeX/Y/Z (µm)
 *   - "Voxel Size (um)" → voxelSizeX/Y/Z (µm)
 *   - "Source Voltage (kV)" → voltageKV
 *   - "Source Current (uA)" → amperageUA
 *   - "Camera Make" / "Scanner" → scannerMakeModel
 *   - "Number of Files" / "Number of Slices" → declaredSliceCount
 *   - "Number of Rows" → declaredDimensionsY
 *   - "Number of Columns" → declaredDimensionsX
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { RecordKeeper as RK } from '../../../../records/recordKeeper';
import { ISidecarParser, SidecarParseResult } from './index';

export class PcaSidecarParser implements ISidecarParser {
    canHandle(fileName: string): boolean {
        return fileName.toLowerCase().endsWith('.pca');
    }

    async parse(filePath: string): Promise<SidecarParseResult> {
        const result: SidecarParseResult = { warnings: [] };
        const unknownKeys: string[] = [];
        let raw: string;
        try {
            raw = await fs.readFile(filePath, 'utf-8');
        } catch (err) {
            result.warnings.push(`Failed to read .pca file: ${err instanceof Error ? err.message : String(err)}`);
            return result;
        }

        const lines: string[] = raw.split(/\r?\n/);
        for (const rawLine of lines) {
            const line: string = stripInlineComment(rawLine).trim();
            if (!line || line.startsWith('[') /* section header — ignored, keys are unique enough */) continue;

            // Split on first `=` or `:`
            const eqIdx: number = indexOfSeparator(line);
            if (eqIdx < 0) continue;

            const keyRaw: string = line.slice(0, eqIdx).trim();
            const value: string = line.slice(eqIdx + 1).trim();
            if (!keyRaw || !value) continue;

            applyKey(result, normalizeKey(keyRaw), value, unknownKeys);
        }

        // Single aggregated warning per file with the full unknown-key list — lets
        // OpenObserve surface "scanner variant X consistently emits keys Y,Z that
        // we don't yet map" without spamming one event per key.
        if (unknownKeys.length > 0) {
            RK.logWarning(RK.LogSection.eJOB, 'pca unknown keys',
                `unmapped keys in ${path.basename(filePath)}: ${unknownKeys.join(',')}`,
                { fileName: path.basename(filePath), unknownKeys },
                'Job.VolumeInspect.PCA');
        }

        return result;
    }
}

function stripInlineComment(line: string): string {
    // Trim comments starting with `;` or `#` (INI convention).
    const idxSemi: number = line.indexOf(';');
    const idxHash: number = line.indexOf('#');
    let idx: number = -1;
    if (idxSemi >= 0) idx = idxSemi;
    if (idxHash >= 0 && (idx < 0 || idxHash < idx)) idx = idxHash;
    return idx >= 0 ? line.slice(0, idx) : line;
}

function indexOfSeparator(line: string): number {
    const a: number = line.indexOf('=');
    const b: number = line.indexOf(':');
    if (a < 0) return b;
    if (b < 0) return a;
    return Math.min(a, b);
}

function normalizeKey(key: string): string {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function applyKey(result: SidecarParseResult, key: string, value: string, unknownKeys: string[]): void {
    const num: number = parseFloat(value);
    const hasNum: boolean = !Number.isNaN(num);

    switch (key) {
        case 'imagepixelsizeum':
        case 'voxelsizeum':
        case 'pixelsizeum':
            if (hasNum) {
                result.voxelSizeX = num;
                result.voxelSizeY = num;
                result.voxelSizeZ = num;
                result.voxelSizeUnit = 'Micrometer';
            }
            return;
        case 'imagepixelsizemm':
        case 'voxelsizemm':
        case 'pixelsizemm':
            if (hasNum) {
                result.voxelSizeX = num;
                result.voxelSizeY = num;
                result.voxelSizeZ = num;
                result.voxelSizeUnit = 'Millimeter';
            }
            return;
        case 'sourcevoltagekv':
        case 'voltagekv':
        case 'kv':
            if (hasNum) result.voltageKV = num;
            return;
        case 'sourcecurrentua':
        case 'currentua':
        case 'ua':
            if (hasNum) result.amperageUA = num;
            return;
        case 'cameramake':
        case 'scanner':
        case 'scannermakemodel':
        case 'systemname':
            result.scannerMakeModel = value;
            return;
        case 'numberoffiles':
        case 'numberofslices':
        case 'slicecount':
            if (hasNum) result.declaredSliceCount = Math.round(num);
            return;
        case 'numberofrows':
        case 'rows':
            if (hasNum) result.declaredDimensionsY = Math.round(num);
            return;
        case 'numberofcolumns':
        case 'columns':
            if (hasNum) result.declaredDimensionsX = Math.round(num);
            return;
        default:
            // Unknown key — record in both the per-result warnings array (visible
            // to operators reading JobRun.Output) and the unknownKeys collector
            // (consumed for the aggregated structured log emission).
            result.warnings.push(`.pca: unknown key ${key}`);
            unknownKeys.push(key);
            return;
    }
}
