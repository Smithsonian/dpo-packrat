import * as WF from '../../interface';
import { WorkflowUtil, WorkflowUtilExtractAssetVersions } from './WorkflowUtil';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as COMMON from '@dpo-packrat/common';
import { Config } from '../../../config';
import * as STORE from '../../../storage/interface';
import * as REP from '../../../report/interface';
import * as H from '../../../utils/helpers';
import { ZipFile } from '../../../utils';
import { SvxReader } from '../../../utils/parser';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

// import * as sharp from 'sharp';
import sharp from 'sharp';
import * as path from 'path';

// This Workflow represents an upload action, typically initiated by a user.
// The workflow itself performs no actual upload work (upload is performed in the graphQl uploadData routine)
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
            workflowStep.setState(COMMON.eWorkflowJobRunStatus.eRunning);
            await workflowStep.update();
        }
        const validateRes: H.IOResults = await this.validateFiles();
        if (!validateRes.success)
            await this.updateStatus(COMMON.eWorkflowJobRunStatus.eError);
        return validateRes;
    }

    async update(_workflowStep: DBAPI.WorkflowStep, _jobRun: DBAPI.JobRun): Promise<WF.WorkflowUpdateResults> {
        return { success: true, workflowComplete: true };
    }

    async updateStatus(eStatus: COMMON.eWorkflowJobRunStatus): Promise<WF.WorkflowUpdateResults> {
        const workflowComplete: boolean = (eStatus === COMMON.eWorkflowJobRunStatus.eDone
            || eStatus === COMMON.eWorkflowJobRunStatus.eError
            || eStatus === COMMON.eWorkflowJobRunStatus.eCancelled);


        // get our step for the current workflow
        const workflowStep: DBAPI.WorkflowStep | null = (!this.workflowData.workflowStep || this.workflowData.workflowStep.length <= 0)
            ? null : this.workflowData.workflowStep[this.workflowData.workflowStep.length - 1];
        if (!workflowStep)
            return { success: false, workflowComplete, error: 'Missing WorkflowStep' };

        // update our status and step
        const updated: boolean = (eStatus!==workflowStep?.getState());
        workflowStep.setState(eStatus);
        const success: boolean = await workflowStep.update();

        RK.logInfo(RK.LogSection.eWF,'workflow update',undefined,
            { workflowComplete, updated, eStatus, workflow: this.workflowData.workflow, set: this.workflowData.workflowSet },
            'Workflow.Upload'
        );

        // if we're not updated or not finished then just return
        if(updated!==true || workflowComplete!==true)
            return { success, workflowComplete, error: success ? '' : 'Database Error' };

        // get all workflows connected to same workflow set
        // NOTE: may not get all workflows since the Set doesn't know the total
        // steps until everything finishes. Going to pause a moment to give DB a chance
        await H.Helpers.sleep(3000);
        const workflowSet: number = this.workflowData.workflow?.idWorkflowSet ?? -1;
        const workflows: DBAPI.Workflow[] | null = await DBAPI.Workflow.fetchFromWorkflowSet(workflowSet);
        if(!workflows || workflows.length===0) {
            RK.logDebug(RK.LogSection.eWF,'update status','no workflows found from set', { idWorkflowSet: this.workflowData.workflow?.idWorkflowSet },'Workflow.Upload');
            return { success, workflowComplete, error: success ? '' : 'Database Error' };
        }

        RK.logDebug(RK.LogSection.eWF,'workflow update','collected workflows',{ workflows, workflowSet },'Workflow.Upload');

        // Get all steps from the workflows
        const workflowSteps: DBAPI.WorkflowStep[] | null = await DBAPI.WorkflowStep.fetchFromWorkflowSet(workflowSet);
        if(!workflowSteps || workflowSteps.length===0)
            return { success, workflowComplete, error: success ? '' : 'Database Error' };

        RK.logDebug(RK.LogSection.eWF,'workflow step update','collected steps',{ workflowSteps },'Workflow.Upload');

        // see if any are still going, if so return
        const stillRunning: boolean = workflowSteps.some( step => ![4,5,6].includes(step.State));
        RK.logDebug(RK.LogSection.eWF,'workflow step update','still running',{ stillRunning },'Workflow.Upload');
        if(stillRunning===true) {
            RK.logDebug(RK.LogSection.eWF,'step update status','still running', { idWorkflow: this.workflowData.workflow?.idWorkflow, workflowSet },'Workflow.Upload');
            return { success, workflowComplete, error: success ? '' : 'Database Error' };
        }

        // extract the start/end dates for the set
        const { startDate, endDate } = workflowSteps.reduce((acc, { DateCreated, DateCompleted }) => ({
            startDate: acc.startDate < DateCreated ? acc.startDate : DateCreated,
            endDate: (!DateCompleted || acc.endDate > DateCompleted) ? acc.endDate : DateCompleted,
        }), { startDate: workflowSteps[0].DateCreated, endDate: workflowSteps[0].DateCompleted || workflowSteps[0].DateCreated });

        // get our report to inject in the message
        // use first workflow since it will hold everything for the set
        let detailsMessage: string = '';
        const workflowReport: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromWorkflowSet(workflowSet);
        if(workflowReport && workflowReport.length>0) {
            detailsMessage = workflowReport[0].Data;
        }

        switch(eStatus) {
            case COMMON.eWorkflowJobRunStatus.eDone: {
                const url: string = Config.http.clientUrl +'/ingestion/uploads';
                await RK.sendEmail(
                    RK.NotifyType.JOB_PASSED,
                    RK.NotifyGroup.EMAIL_USER,
                    'Upload and Inspection Finished',
                    detailsMessage,
                    startDate,
                    endDate,
                    (url.length>0) ? { url, label: 'Uploads' } : undefined
                );
            } break;

            case COMMON.eWorkflowJobRunStatus.eError: {
                const url: string = Config.http.clientUrl +'/workflow';
                await RK.sendEmail(
                    RK.NotifyType.JOB_FAILED,
                    RK.NotifyGroup.EMAIL_USER,
                    'Upload and Inspection Failed',
                    detailsMessage,
                    startDate,
                    endDate,
                    (url.length>0) ? { url, label: 'Reports' } : undefined
                );
            } break;
        }

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

        if (!WFUVersion.systemObjectAssetVersionMap)
            return this.results;

        for (const [ idSystemObject, idAssetVersion ] of WFUVersion.systemObjectAssetVersionMap) {
            const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
            if (!assetVersion)
                return this.handleError(`WorkflowUpload.validateFiles unable to fetch asset version ${idAssetVersion}`);
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
            if (!asset)
                return this.handleError(`WorkflowUpload.validateFiles unable to load asset for ${assetVersion.idAsset}`);

            // see if the passed in file is a model
            const isModel: boolean = await this.testIfModel(assetVersion.FileName, asset);

            const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersionByID(idAssetVersion);
            if (!RSR.success || !RSR.readStream || !RSR.fileName)
                return this.handleError(`WorkflowUpload.validateFiles unable to read asset version ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}: ${RSR.error}`);
            this.appendToWFReport(`Upload validation of ${RSR.fileName}`);

            let fileRes: H.IOResults = { success: true };
            if (isModel) {
                // if we're a model, zipped or not, validate the entire file/collection as is:
                fileRes = await this.validateFileModel(RSR.fileName, RSR.readStream, false, idSystemObject);
            } else if (path.extname(RSR.fileName).toLowerCase() !== '.zip') { // not a zip
                // we are not a zip
                fileRes = await this.validateFile(RSR.fileName, RSR.readStream, false, idSystemObject, asset);
            } else {
                // it's not a model (e.g. Capture Data)
                // grab our storage instance
                const storage: STORE.IStorage | null = await STORE.StorageFactory.getInstance(); /* istanbul ignore next */
                if (!storage) {
                    const error: string = 'WorkflowUpload.validateFiles: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
                    return this.handleError(error);
                }

                // figure out our path
                const filePath: string = await storage.stagingFileName(assetVersion.StorageKeyStaging);

                // use ZipFile so we don't need to load it all into memory
                const ZS: ZipFile = new ZipFile(filePath);
                const zipRes: H.IOResults = await ZS.load();
                if (!zipRes.success)
                    return this.handleError(`WorkflowUpload.validateFiles unable to unzip asset version ${RSR.fileName}: ${zipRes.error}`);

                const files: string[] = await ZS.getJustFiles(null);
                if (!files || files.length === 0)
                    return this.handleError('Zip file is unexpectedly empty');
                for (const fileName of files) {
                    const readStream: NodeJS.ReadableStream | null = await ZS.streamContent(fileName);
                    if (!readStream)
                        return this.handleError(`WorkflowUpload.validateFiles unable to fetch read stream for ${fileName} in zip of asset version ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`);
                    await this.validateFile(fileName, readStream, true, idSystemObject, asset);
                }
            }

            if (fileRes.success) {
                if (assetVersion.Ingested === null) {
                    assetVersion.Ingested = false;
                    if (!await assetVersion.update())
                        this.handleError(`WorkflowUpload.validateFile ${RSR.fileName} post-upload workflow succeeded, but unable to update asset version ingested flag`);
                }
            } else { // fileRes.success === false
                const ASR: STORE.AssetStorageResult = await STORE.AssetStorageAdapter.discardAssetVersion(assetVersion);
                if (!ASR.success)
                    this.handleError(`WorkflowUpload.validateFile ${RSR.fileName} failed to discard failed upload: ${ASR.error}`);
            }
        }

        return this.results;
    }

    private async validateFile(fileName: string, readStream: NodeJS.ReadableStream, fromZip: boolean, idSystemObject: number,
        asset: DBAPI.Asset): Promise<H.IOResults> {

        // validate scene file by loading it:
        if (fileName.toLowerCase().endsWith('.svx.json'))
            return this.validateFileScene(fileName, readStream);
        else if (await this.testIfModel(fileName, asset))
            return this.validateFileModel(fileName, readStream, fromZip, idSystemObject);
        else {
            // validate formats handled by Sharp
            switch (path.extname(fileName).toLowerCase()) {
                case '.avif':
                case '.gif':
                case '.jpg':
                case '.jpeg':
                case '.png':
                case '.svg':
                case '.tif':
                case '.tiff':
                case '.webp':
                    return this.validateFileImage(fileName, readStream);

                default: break;
            }
        }

        this.appendToWFReport(`Upload validation skipped for ${fileName}`);
        return { success: true };
    }

    private async validateFileScene(fileName: string, readStream: NodeJS.ReadableStream): Promise<H.IOResults> {
        const svxReader: SvxReader = new SvxReader();
        const svxRes: H.IOResults = await svxReader.loadFromStream(readStream);
        RK.logError(RK.LogSection.eWF,'validating voyager scene',undefined, { fileName },'Workflow.Upload');
        return (svxRes.success)
            ? this.appendToWFReport(`Upload validated ${fileName}`)
            : this.handleError(`WorkflowUpload.validateFile failed to parse svx file ${fileName}: ${svxRes.error}`);
    }

    private async validateFileImage(fileName: string, readStream: NodeJS.ReadableStream): Promise<H.IOResults> {
        const buffer: Buffer | null = await H.Helpers.readFileFromStream(readStream);
        if (!buffer)
            return this.handleError(`WorkflowUpload.validateFile unable to read stream for ${fileName}`);
        try {
            const SH: sharp.Sharp = sharp(buffer);
            const stats: sharp.Stats = await SH.stats();
            RK.logDebug(RK.LogSection.eWF,'validating image',undefined, { fileName, stats },'Workflow.Upload');
            return (stats.channels.length >= 1)
                ? this.appendToWFReport(`Upload validated ${fileName}`)
                : this.handleError(`WorkflowUpload.validateFile encountered invalid image ${fileName}`);
        } catch (error) {
            const message: string = `WorkflowUpload.validateFile encountered exception processing ${fileName}${(error instanceof Error) ? ': ' + error.message : ''}`;
            return (path.extname(fileName).toLowerCase() !== '.svg') ? this.handleError(message) : this.appendToWFReport(message);
        }
    }

    private async validateFileModel(fileName: string, readStream: NodeJS.ReadableStream, fromZip: boolean, idSystemObject: number): Promise<H.IOResults> {
        const results: H.IOResults = await WorkflowUtil.computeModelMetrics(fileName, undefined, undefined, idSystemObject, undefined,
            !fromZip ? undefined : readStream, this.workflowParams.idProject, this.workflowParams.idUserInitiator);
        if (!results.success)
            return this.handleError(results.error ?? '');
        this.appendToWFReport(`Upload validated ${fileName}${results.error ? ': ' + results.error : ''}`);
        return results;
    }

    private async testIfModel(fileName: string, asset: DBAPI.Asset): Promise<boolean> {
        // compare our model extension to defined vocabulary for models and geometry files.
        // if it doesn't resolve to either type then fail the check.
        if (await CACHE.VocabularyCache.mapModelFileByExtension(fileName) !== undefined)
            return true;
        // might be zipped; check asset
        const eAssetType: COMMON.eVocabularyID | undefined = await asset.assetType();
        switch (eAssetType) {
            case COMMON.eVocabularyID.eAssetAssetTypeModel:
            case COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile:
                return true;
        }
        return false;
    }

    private async appendToWFReport(message: string, isError?: boolean | undefined): Promise<H.IOResults> {
        if (isError)
            RK.logError(RK.LogSection.eWF,'workflow upload error',message, { idWorkflow: this.workflowData.workflow?.idWorkflow },'Workflow.Upload');
        else
            RK.logInfo(RK.LogSection.eWF,'workflow upload status',message, { idWorkflow: this.workflowData.workflow?.idWorkflow },'Workflow.Upload');
        return (this.workflowReport) ? this.workflowReport.append(message) : { success: true };
    }

    private async handleError(error: string): Promise<H.IOResults> {
        this.appendToWFReport(error, true);

        this.results = { success: false, error: (this.results.error ? this.results.error + '/n' : '') + error };
        return this.results;
    }

    async getWorkflowObject(): Promise<DBAPI.Workflow | null> {

        // get our constellation
        const wfConstellation: DBAPI.WorkflowConstellation | null = await this.workflowConstellation();
        if(!wfConstellation) {
            RK.logError(RK.LogSection.eWF,'get workflow failed','no constellation found. not initialized?', { idWorkflow: this.workflowData.workflow?.idWorkflow },'Workflow.Upload');
            return null;
        }

        return wfConstellation.workflow;
    }
}
