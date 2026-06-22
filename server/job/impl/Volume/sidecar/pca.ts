/**
 * `.pca` sidecar parser — acquisition parameters.
 *
 * A `.pca` is an INI-style file emitted before reconstruction. The concrete key layout
 * varies by scanner vendor, so the file is parsed once into a section-aware {@link IniDoc}
 * and then handed to the first matching vendor profile; an unrecognized layout falls back to
 * the generic profile. Add a vendor by implementing {@link IPcaVendorProfile} and registering
 * it in `PCA_VENDOR_PROFILES` ahead of the generic fallback.
 *
 * Each profile fills the shared {@link SidecarParseResult} accumulator, populating only the
 * fields the `.pca` is authoritative for (acquisition voltage / current / scanner, and an
 * acquisition voxel size). Reconstructed geometry (final voxel size, volume dimensions, slice
 * count) is owned by the `.pcr` parser and is intentionally not derived here.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { RecordKeeper as RK } from '../../../../records/recordKeeper';
import { IniDoc, parseIni } from '../../../../utils/iniReader';
import { ISidecarParser, SidecarParseResult } from './index';

interface IPcaVendorProfile {
    name: string;
    detect(ini: IniDoc): boolean;
    apply(ini: IniDoc, acc: SidecarParseResult, fileName: string): void;
}

export class PcaSidecarParser implements ISidecarParser {
    canHandle(fileName: string): boolean {
        return fileName.toLowerCase().endsWith('.pca');
    }

    async parse(filePath: string, acc: SidecarParseResult): Promise<SidecarParseResult> {
        let raw: string;
        try {
            // latin1: .pca files carry cp1252 bytes (e.g. the µ in "µCT").
            raw = await fs.readFile(filePath, 'latin1');
        } catch (err) {
            acc.warnings.push(`Failed to read .pca file: ${err instanceof Error ? err.message : String(err)}`);
            return acc;
        }

        const ini: IniDoc = parseIni(raw);
        const fileName: string = path.basename(filePath);
        const profile: IPcaVendorProfile = PCA_VENDOR_PROFILES.find(p => p.detect(ini)) ?? GENERIC_PCA_PROFILE;

        RK.logDebug(RK.LogSection.eJOB, 'pca vendor detected', `using ${profile.name} profile`,
            { fileName, profile: profile.name }, 'Job.VolumeInspect.PCA');

        profile.apply(ini, acc, fileName);
        return acc;
    }
}

// #region helpers

function setNumberIfEmpty(acc: SidecarParseResult, field: 'voxelSizeX' | 'voxelSizeY' | 'voxelSizeZ' | 'voltageKV' | 'amperageUA', value: string | undefined): boolean {
    if (value === undefined || acc[field] !== undefined) return false;
    const num: number = parseFloat(value);
    if (!Number.isFinite(num)) return false;
    acc[field] = num;
    return true;
}

// #endregion

// #region GE Phoenix v|tome|x (datos|x) profile

// GE Phoenix stores tube current in microamps natively; a value above this is implausible for a
// µCT source and almost certainly indicates a different unit, so we surface it for verification.
const GE_PHOENIX_PLAUSIBLE_MAX_UA = 5000;

const GE_PHOENIX_PCA_PROFILE: IPcaVendorProfile = {
    name: 'GEPhoenix',
    detect(ini: IniDoc): boolean {
        if (ini.hasSection('geometry') && ini.hasSection('xray')) return true;
        const systemName: string | undefined = ini.get('general', 'systemname');
        return systemName !== undefined && /phoenix|tome/i.test(systemName);
    },
    apply(ini: IniDoc, acc: SidecarParseResult, fileName: string): void {
        // X-ray source settings — kV and µA are GE Phoenix native units (no scaling).
        setNumberIfEmpty(acc, 'voltageKV', ini.get('xray', 'voltage'));
        const setUA: boolean = setNumberIfEmpty(acc, 'amperageUA', ini.get('xray', 'current'));
        if (setUA && acc.amperageUA !== undefined && acc.amperageUA > GE_PHOENIX_PLAUSIBLE_MAX_UA)
            acc.warnings.push(`.pca: tube current ${acc.amperageUA} read as µA looks high — verify units`);

        // Acquisition voxel size (mm). The reconstructed voxel from a .pcr, when present, supersedes this.
        const setX: boolean = setNumberIfEmpty(acc, 'voxelSizeX', ini.get('geometry', 'voxelsizex'));
        const setY: boolean = setNumberIfEmpty(acc, 'voxelSizeY', ini.get('geometry', 'voxelsizey'));
        if ((setX || setY) && acc.voxelSizeUnit === undefined)
            acc.voxelSizeUnit = 'Millimeter';

        if (acc.scannerMakeModel === undefined) {
            const systemName: string | undefined = ini.get('general', 'systemname');
            if (systemName && systemName.trim().length > 0)
                acc.scannerMakeModel = systemName.trim();
        }

        // Note: [Image] DimX/DimY and [CT] NumberImages describe the detector / projection set,
        // not the reconstructed volume, so they are deliberately not mapped to volume geometry.
        void fileName;
    },
};

// #endregion

// #region Generic profile (fallback — original .pca key map)

const GENERIC_PCA_PROFILE: IPcaVendorProfile = {
    name: 'generic',
    detect(): boolean {
        return true;        // always matches; ordered last so it is the fallback
    },
    apply(ini: IniDoc, acc: SidecarParseResult, fileName: string): void {
        const unknownKeys: string[] = [];
        for (const { key, value } of ini.entries()) {
            if (!key || value.length === 0) continue;
            applyGenericKey(acc, key, value, unknownKeys);
        }

        // Single aggregated warning per file with the full unknown-key list — lets OpenObserve
        // surface "scanner variant X consistently emits keys Y,Z that we don't yet map" without
        // spamming one event per key.
        if (unknownKeys.length > 0) {
            RK.logWarning(RK.LogSection.eJOB, 'pca unknown keys',
                `unmapped keys in ${fileName}: ${unknownKeys.join(',')}`,
                { fileName, unknownKeys },
                'Job.VolumeInspect.PCA');
        }
    },
};

function applyGenericKey(acc: SidecarParseResult, key: string, value: string, unknownKeys: string[]): void {
    const num: number = parseFloat(value);
    const hasNum: boolean = !Number.isNaN(num);

    switch (key) {
        case 'imagepixelsizeum':
        case 'voxelsizeum':
        case 'pixelsizeum':
            if (hasNum) {
                acc.voxelSizeX = num;
                acc.voxelSizeY = num;
                acc.voxelSizeZ = num;
                acc.voxelSizeUnit = 'Micrometer';
            }
            return;
        case 'imagepixelsizemm':
        case 'voxelsizemm':
        case 'pixelsizemm':
            if (hasNum) {
                acc.voxelSizeX = num;
                acc.voxelSizeY = num;
                acc.voxelSizeZ = num;
                acc.voxelSizeUnit = 'Millimeter';
            }
            return;
        case 'sourcevoltagekv':
        case 'voltagekv':
        case 'kv':
            if (hasNum) acc.voltageKV = num;
            return;
        case 'sourcecurrentua':
        case 'currentua':
        case 'ua':
            if (hasNum) acc.amperageUA = num;
            return;
        case 'cameramake':
        case 'scanner':
        case 'scannermakemodel':
        case 'systemname':
            acc.scannerMakeModel = value;
            return;
        case 'numberoffiles':
        case 'numberofslices':
        case 'slicecount':
            if (hasNum) acc.declaredSliceCount = Math.round(num);
            return;
        case 'numberofrows':
        case 'rows':
            if (hasNum) acc.declaredDimensionsY = Math.round(num);
            return;
        case 'numberofcolumns':
        case 'columns':
            if (hasNum) acc.declaredDimensionsX = Math.round(num);
            return;
        default:
            // Unknown key — recorded in both the per-result warnings array (visible to operators
            // reading JobRun.Output) and the unknownKeys collector (consumed for the aggregated log).
            acc.warnings.push(`.pca: unknown key ${key}`);
            unknownKeys.push(key);
            return;
    }
}

// Ordered: specific vendors first, generic fallback last.
const PCA_VENDOR_PROFILES: IPcaVendorProfile[] = [
    GE_PHOENIX_PCA_PROFILE,
];

// #endregion
