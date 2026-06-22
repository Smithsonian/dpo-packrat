/**
 * Output contract for JobVolumeInspect.
 *
 * `VolumeExtractedMetadata` is the JSON shape written to `JobRun.Output` by a
 * successful inspection. Read by the ingestion form so the user mostly
 * confirms rather than types.
 *
 * Fields are organized into three groups:
 *   - Hard inventory facts (always present after a successful inspection)
 *   - Probable scan parameters (best-effort from sidecar / first-slice header)
 *   - Companion file paths (preserved, not parsed)
 */
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as H from '../../../utils/helpers';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

export type VolumeContentType = 'IMAGE_STACK' | 'DICOM' | 'OTHER';
export type VolumeSizeUnit = 'Micrometer' | 'Millimeter';

export interface VolumeExtractedMetadata {
    // Hard inventory facts (always present)
    fileCount: number;
    sliceCount: number;
    contentType: VolumeContentType;

    // Probable scan parameters (parsed from sidecar / first-slice header; may be undefined)
    dimensionsX?: number;
    dimensionsY?: number;
    dimensionsZ?: number;
    bitDepth?: number;
    voxelSizeX?: number;
    voxelSizeY?: number;
    voxelSizeZ?: number;
    voxelSizeUnit?: VolumeSizeUnit;
    modality?: string;
    voltageKV?: number;
    amperageUA?: number;
    scannerMakeModel?: string;

    // Companion file paths (preserved, not parsed)
    scanSheetPaths: string[];
    scanLogPaths: string[];
    vendorSidecarPaths: string[];

    // Diagnostics
    warnings: string[];
}

export class JobVolumeInspectOutput implements H.IOResults {
    success: boolean;
    error: string;
    metadata: VolumeExtractedMetadata | null;

    constructor(metadata: VolumeExtractedMetadata | null, error?: string) {
        this.success = !error && metadata !== null;
        this.error = error ?? '';
        this.metadata = metadata;
    }

    /**
     * Locate the most recent completed Volume Inspect JobRun for an asset version
     * and return its parsed output. Mirrors `JobCookSIPackratInspectOutput.extractFromAssetVersion`.
     */
    static async extractFromAssetVersion(idAssetVersion: number): Promise<JobVolumeInspectOutput | null> {
        const idVJobType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(COMMON.eVocabularyID.eJobJobTypeVolumeInspect);
        if (!idVJobType) {
            RK.logError(RK.LogSection.eJOB,'extract volume output failed','unable to compute Job ID of Volume Inspect',{ idAssetVersion },'Job.VolumeInspect.Output');
            return null;
        }

        const jobRuns: DBAPI.JobRun[] | null = await DBAPI.JobRun.fetchMatching(1, idVJobType, COMMON.eWorkflowJobRunStatus.eDone, true, [idAssetVersion]);
        if (!jobRuns || jobRuns.length !== 1) {
            RK.logError(RK.LogSection.eJOB,'extract volume output failed','unable to fetch Volume Inspect JobRun',{ idAssetVersion, found: jobRuns?.length ?? 0 },'Job.VolumeInspect.Output');
            return null;
        }

        const jobRun: DBAPI.JobRun = jobRuns[0];
        if (!jobRun.Output)
            return new JobVolumeInspectOutput(null, 'JobRun.Output is empty');

        try {
            const metadata: VolumeExtractedMetadata = JSON.parse(jobRun.Output);
            return new JobVolumeInspectOutput(metadata);
        } catch (err) {
            RK.logError(RK.LogSection.eJOB,'extract volume output failed',`JSON parse error: ${H.Helpers.getErrorString(err)}`,{ idAssetVersion },'Job.VolumeInspect.Output');
            return new JobVolumeInspectOutput(null, `Failed to parse JobRun.Output: ${H.Helpers.getErrorString(err)}`);
        }
    }
}
