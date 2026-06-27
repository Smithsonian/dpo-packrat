/**
 * `.pcr` sidecar parser — reconstruction parameters.
 *
 * A `.pcr` is an INI-style file emitted after reconstruction. It is authoritative for the
 * reconstructed volume: final (isotropic) voxel size, volume dimensions, and slice count. It
 * usually does not repeat the X-ray source settings — it references its `.pca` instead — so
 * those come from the `.pca` parser.
 *
 * Mirroring `pca.ts`: the file is parsed once into a section-aware {@link IniDoc} and handed to
 * the first matching vendor profile, with a generic fallback that warns when no profile matches.
 * The reconstructed voxel size overrides any acquisition voxel size an earlier `.pca` supplied,
 * since reconstruction is authoritative for the volume actually being ingested.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { RecordKeeper as RK } from '../../../../records/recordKeeper';
import { IniDoc, parseIni } from '../../../../utils/iniReader';
import { ISidecarParser, SidecarParseResult } from './index';

interface IPcrVendorProfile {
    name: string;
    detect(ini: IniDoc): boolean;
    apply(ini: IniDoc, acc: SidecarParseResult, fileName: string): void;
}

export class PcrSidecarParser implements ISidecarParser {
    canHandle(fileName: string): boolean {
        return fileName.toLowerCase().endsWith('.pcr');
    }

    async parse(filePath: string, acc: SidecarParseResult): Promise<SidecarParseResult> {
        let raw: string;
        try {
            raw = await fs.readFile(filePath, 'latin1');
        } catch (err) {
            acc.warnings.push(`Failed to read .pcr file: ${err instanceof Error ? err.message : String(err)}`);
            return acc;
        }

        const ini: IniDoc = parseIni(raw);
        const fileName: string = path.basename(filePath);
        const profile: IPcrVendorProfile | undefined = PCR_VENDOR_PROFILES.find(p => p.detect(ini));

        if (!profile) {
            acc.warnings.push(`.pcr: unrecognized format in ${fileName}; no reconstruction fields extracted`);
            RK.logWarning(RK.LogSection.eJOB, 'pcr format unrecognized', `no profile matched ${fileName}`,
                { fileName, sections: ini.sections() }, 'Job.VolumeInspect.PCR');
            return acc;
        }

        RK.logDebug(RK.LogSection.eJOB, 'pcr vendor detected', `using ${profile.name} profile`,
            { fileName, profile: profile.name }, 'Job.VolumeInspect.PCR');

        profile.apply(ini, acc, fileName);
        return acc;
    }
}

// #region helpers

function parseFiniteFloat(value: string | undefined): number | undefined {
    if (value === undefined) return undefined;
    const num: number = parseFloat(value);
    return Number.isFinite(num) ? num : undefined;
}

// #endregion

// #region GE Phoenix v|tome|x (datos|x) profile

const GE_PHOENIX_PCR_PROFILE: IPcrVendorProfile = {
    name: 'GEPhoenix',
    detect(ini: IniDoc): boolean {
        return ini.hasSection('volumedata') || ini.hasSection('reconstructionsettings');
    },
    apply(ini: IniDoc, acc: SidecarParseResult, fileName: string): void {
        // Reconstructed voxel size is isotropic and authoritative — override any acquisition voxel.
        const voxel: number | undefined = parseFiniteFloat(ini.get('volumedata', 'voxelsizerec'));
        if (voxel !== undefined) {
            acc.voxelSizeX = voxel;
            acc.voxelSizeY = voxel;
            acc.voxelSizeZ = voxel;
            acc.voxelSizeUnit = 'Millimeter';
        }

        const sizeX: number | undefined = parseFiniteFloat(ini.get('volumedata', 'volumesizex'));
        const sizeY: number | undefined = parseFiniteFloat(ini.get('volumedata', 'volumesizey'));
        const sizeZ: number | undefined = parseFiniteFloat(ini.get('volumedata', 'volumesizez'));
        if (sizeX !== undefined) acc.declaredDimensionsX = Math.round(sizeX);
        if (sizeY !== undefined) acc.declaredDimensionsY = Math.round(sizeY);
        if (sizeZ !== undefined) acc.declaredSliceCount = Math.round(sizeZ);

        void fileName;
    },
};

const PCR_VENDOR_PROFILES: IPcrVendorProfile[] = [
    GE_PHOENIX_PCR_PROFILE,
];

// #endregion
