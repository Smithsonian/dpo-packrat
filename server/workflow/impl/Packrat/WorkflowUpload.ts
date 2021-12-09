import * as WF from '../../interface';
import { WorkflowUtil, WorkflowUtilExtractAssetVersions } from './WorkflowUtil';
import * as DBAPI from '../../../db';
import * as STORE from '../../../storage/interface';
import * as REP from '../../../report/interface';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
import { ZipStream } from '../../../utils/zipStream';
import { SvxReader } from '../../../utils/parser';

// import * as sharp from 'sharp';
import sharp from 'sharp';
import * as path from 'path';

// This Workflow represents an ingestion action, typically initiated by a user.
// The workflow itself performs no work (ingestion is performed in the graphQl ingestData routine)
// Instead, this workflow provide a means for gathering ingestion report output
export class WorkflowUpload implements WF.IWorkflow {
    private workflowParams: WF.WorkflowParameters;
    private workflowData: DBAPI.WorkflowConstellation;
    private workflowReport: REP.IReport | null = null;
    private results: H.IOResults = { success: true };

    static async constructWorkflow(workflowParams: WF.WorkflowParameters, WFC: DBAPI.WorkflowConstellation): Promise<WorkflowUpload | null> {
        return new WorkflowUpload(workflowParams, WFC);
    }

    constructor(workflowParams: WF.WorkflowParameters, workflowData: DBAPI.WorkflowConstellation) {
        this.workflowParams = workflowParams;
        this.workflowData = workflowData;
        this.workflowParams; this.workflowData;
    }

    async start(): Promise<H.IOResults> {
        this.workflowReport = await REP.ReportFactory.getReport();

        const workflowStep: DBAPI.WorkflowStep | null = (!this.workflowData.workflowStep || this.workflowData.workflowStep.length <= 0)
            ? null : this.workflowData.workflowStep[this.workflowData.workflowStep.length - 1];
        if (workflowStep) {
            workflowStep.setState(DBAPI.eWorkflowJobRunStatus.eRunning);
            await workflowStep.update();
        }
        const validateRes: H.IOResults = await this.validateFiles();
        if (!validateRes.success)
            await this.updateStatus(DBAPI.eWorkflowJobRunStatus.eError);
        return validateRes;
    }

    async update(_workflowStep: DBAPI.WorkflowStep, _jobRun: DBAPI.JobRun): Promise<WF.WorkflowUpdateResults> {
        return { success: true, workflowComplete: true };
    }

    async updateStatus(eStatus: DBAPI.eWorkflowJobRunStatus): Promise<WF.WorkflowUpdateResults> {
        const workflowComplete: boolean = (eStatus === DBAPI.eWorkflowJobRunStatus.eDone
            || eStatus === DBAPI.eWorkflowJobRunStatus.eError
            || eStatus === DBAPI.eWorkflowJobRunStatus.eCancelled);

        const workflowStep: DBAPI.WorkflowStep | null = (!this.workflowData.workflowStep || this.workflowData.workflowStep.length <= 0)
            ? null : this.workflowData.workflowStep[this.workflowData.workflowStep.length - 1];

        if (!workflowStep)
            return { success: false, workflowComplete, error: 'Missing WorkflowStep' };
        workflowStep.setState(eStatus);
        const success: boolean = await workflowStep.update();
        return { success, workflowComplete, error: success ? '' : 'Database Error' };
    }

    async waitForCompletion(_timeout: number): Promise<H.IOResults> {
        return this.results;
    }

    async workflowConstellation(): Promise<DBAPI.WorkflowConstellation | null> {
        return this.workflowData;
    }

    private async validateFiles(): Promise<H.IOResults> {
        this.appendToWFReport('Upload validating files');

        const WFUVersion: WorkflowUtilExtractAssetVersions = await WorkflowUtil.extractAssetVersions(this.workflowParams.idSystemObject);
        if (!WFUVersion.success) {
            this.results = { success: false, error: WFUVersion.error };
            return this.results;
        }

        if (!WFUVersion.idAssetVersions)
            return this.results;

        for (const idAssetVersion of WFUVersion.idAssetVersions) {
            const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersionByID(idAssetVersion);
            if (!RSR.success || !RSR.readStream || !RSR.fileName)
                return this.handleError(`WorkflowUpload.validateFiles unable to read asset version ${idAssetVersion}: ${RSR.error}`);

            let fileRes: H.IOResults = { success: true };
            if (path.extname(RSR.fileName).toLowerCase() !== '.zip')
                fileRes = await this.validateFile(RSR.fileName, RSR.readStream);
            else {
                const ZS: ZipStream = new ZipStream(RSR.readStream);
                const zipRes: H.IOResults = await ZS.load();
                if (!zipRes.success)
                    return this.handleError(`WorkflowUpload.validateFiles unable to read zipped asset version ${idAssetVersion}: ${zipRes.error}`);

                const files: string[] = await ZS.getJustFiles(null);
                for (const fileName of files) {
                    const readStream: NodeJS.ReadableStream | null = await ZS.streamContent(fileName);
                    if (!readStream)
                        return this.handleError(`WorkflowUpload.validateFiles unable to fetch read stream for ${fileName} in zip of idAssetVersion ${idAssetVersion}`);
                    fileRes = await this.validateFile(fileName, readStream);
                }
            }

            if (!fileRes.success)
                return this.results;
        }

        return this.results;
    }

    private async validateFile(fileName: string, readStream: NodeJS.ReadableStream): Promise<H.IOResults> {
        let extension: string = '';
        try {
            // validate scene file by loading it:
            if (fileName.toLowerCase().endsWith('.svx.json')) {
                const svxReader: SvxReader = new SvxReader();
                const svxRes: H.IOResults = await svxReader.loadFromStream(readStream);
                // LOG.info(`WorkflowUpload.validateFile validating SVX: ${svxRes.success}`, LOG.LS.eWF);
                return (svxRes.success)
                    ? this.appendToWFReport(`Upload validated ${fileName}`)
                    : this.handleError(`WorkflowUpload.validateFile failed to parse svx file ${fileName}: ${svxRes.error}`);
            }

            extension = path.extname(fileName).toLowerCase();
            switch (extension) {
                case '.avif':
                case '.gif':
                case '.jpg':
                case '.jpeg':
                case '.png':
                case '.svg':
                case '.tif':
                case '.tiff':
                case '.webp': {
                    const buffer: Buffer | null = await H.Helpers.readFileFromStream(readStream);
                    if (!buffer)
                        return this.handleError(`WorkflowUpload.validateFile unable to read stream for ${fileName}`);
                    const SH: sharp.Sharp = sharp(buffer);
                    const stats: sharp.Stats = await SH.stats();
                    // LOG.info(`WorkflowUpload.validateFile validating image with extension ${extension}, with ${stats.channels.length} channels`, LOG.LS.eWF);
                    return (stats.channels.length >= 1)
                        ? this.appendToWFReport(`Upload validated ${fileName}`)
                        : this.handleError(`WorkflowUpload.validateFile encountered invalid image ${fileName}`);
                }

                default: break;
            }
        } catch (error) {
            const message: string = `WorkflowUpload.validateFile encountered exception processing ${fileName}${(error instanceof Error) ? ': ' + error.message : ''}`;
            return (extension !== '.svg') ? this.handleError(message) : this.appendToWFReport(message);
        }
        return { success: true };
    }

    private async appendToWFReport(message: string): Promise<H.IOResults> {
        LOG.info(message, LOG.LS.eWF);
        return (this.workflowReport) ? this.workflowReport.append(message) : { success: true };
    }

    private async handleError(error: string): Promise<H.IOResults> {
        this.appendToWFReport(error);

        LOG.error(error, LOG.LS.eWF);
        this.results = { success: false, error };
        return this.results;
    }
}
