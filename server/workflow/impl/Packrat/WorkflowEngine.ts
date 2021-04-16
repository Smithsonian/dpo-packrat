/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as WF from '../../interface';
import * as WFP from '../../../workflow/impl/Packrat';
import { WorkflowJob } from './WorkflowJob';
import * as COOK from '../../../job/impl/Cook';
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';

export class WorkflowEngine implements WF.IWorkflowEngine {
    private workflowMap: Map<number, WF.IWorkflow> = new Map<number, WF.IWorkflow>();

    async create(workflowParams: WF.WorkflowParameters): Promise<WF.IWorkflow | null> {
        LOG.info(`WorkflowEngine.create workflow [${this.workflowMap.size}]: ${JSON.stringify(workflowParams)}`, LOG.LS.eWF);
        const WFC: DBAPI.WorkflowConstellation | null = await this.createDBObjects(workflowParams);
        if (!WFC)
            return null;

        if (!workflowParams.eWorkflowType) {
            LOG.error(`WorkflowEngine.create called without workflow type ${JSON.stringify(workflowParams)}`, LOG.LS.eWF);
            return null;
        }

        const workflow: WF.IWorkflow | null = await this.fetchWorkflowImpl(workflowParams, WFC);
        if (!workflow) {
            LOG.error(`WorkflowEngine.create failed to fetch workflow implementation ${CACHE.eVocabularyID[workflowParams.eWorkflowType]}`, LOG.LS.eWF);
            return null;
        }
        if (WFC.workflow)
            this.workflowMap.set(WFC.workflow.idWorkflow, workflow);
        const startResults: H.IOResults = await workflow.start();
        if (!startResults) {
            LOG.error(`WorkflowEngine.create failed to start workflow ${CACHE.eVocabularyID[workflowParams.eWorkflowType]}`, LOG.LS.eWF);
            return null;
        }
        LOG.info(`WorkflowEngine.created workflow [${this.workflowMap.size}]: ${JSON.stringify(workflowParams)}`, LOG.LS.eWF);
        return workflow;
    }

    async jobUpdated(idJobRun: number): Promise<boolean> {
        LOG.info(`WorkflowEngine.jobUpdated: ${idJobRun}`, LOG.LS.eWF);

        const jobRun: DBAPI.JobRun | null = await DBAPI.JobRun.fetch(idJobRun);
        if (!jobRun)
            return false;
        const workflowSteps: DBAPI.WorkflowStep[] | null = await DBAPI.WorkflowStep.fetchFromJobRun(idJobRun);
        if (!workflowSteps)
            return false;

        let result: boolean = true;
        for (const workflowStep of workflowSteps) {
            const WFC: DBAPI.WorkflowConstellation | null = await DBAPI.WorkflowConstellation.fetch(workflowStep.idWorkflow);
            if (!WFC || !WFC.workflow) {
                LOG.error(`WorkflowEngine.jobUpdated (${idJobRun}) skipping orphan workflow step ${JSON.stringify(workflowStep)}`, LOG.LS.eWF);
                continue;
            }

            // lookup workflow object and forward "updated" event
            const workflow: WF.IWorkflow | undefined = this.workflowMap.get(WFC.workflow.idWorkflow);
            if (!workflow) {
                LOG.error(`WorkflowEngine.jobUpdated(${idJobRun}) unable to locate workflow ${WFC.workflow.idWorkflow}`, LOG.LS.eWF);
                continue;
            }

            const updateRes: WF.WorkflowUpdateResults = await workflow.update(workflowStep, jobRun);
            if (updateRes.workflowComplete) {
                this.workflowMap.delete(WFC.workflow.idWorkflow);
                LOG.info(`WorkflowEngine.jobUpdated completed workflow [${this.workflowMap.size}]: ${idJobRun}`, LOG.LS.eWF);
            }
            result = updateRes.success && result;
        }
        return result;
    }

    async event(eWorkflowEvent: CACHE.eVocabularyID, workflowParams: WF.WorkflowParameters | null): Promise<WF.IWorkflow | null> {
        LOG.info(`WorkflowEngine.event ${CACHE.eVocabularyID[eWorkflowEvent]}`, LOG.LS.eWF);
        const idVWorkflowEvent: number | undefined = await WorkflowEngine.computeWorkflowIDFromEnum(eWorkflowEvent, CACHE.eVocabularySetID.eWorkflowEvent);
        if (!idVWorkflowEvent) {
            LOG.error(`WorkflowEngine.event called with invalid workflow event type ${CACHE.eVocabularyID[eWorkflowEvent]}`, LOG.LS.eWF);
            return null;
        }

        switch (eWorkflowEvent) {
            case CACHE.eVocabularyID.eWorkflowEventIngestionUploadAssetVersion: return this.eventIngestionUploadAssetVersion(workflowParams);
            default:
                LOG.info(`WorkflowEngine.event called with unhandled workflow event type ${CACHE.eVocabularyID[eWorkflowEvent]}`, LOG.LS.eWF);
                return null;
        }
    }

    private async eventIngestionUploadAssetVersion(workflowParams: WF.WorkflowParameters | null): Promise<WF.IWorkflow | null> {
        if (!workflowParams || !workflowParams.idSystemObject)
            return null;

        let workflow: WF.IWorkflow | null = null;
        for (const idSystemObject of workflowParams.idSystemObject) {
            const oID: CACHE.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
            if (!oID) {
                LOG.error(`WorkflowEngine.eventIngestionUploadAssetVersion skipping invalid idSystemObject ${idSystemObject}`, LOG.LS.eWF);
                continue;
            }

            if (oID.eObjectType != DBAPI.eSystemObjectType.eAssetVersion) {
                LOG.error(`WorkflowEngine.eventIngestionUploadAssetVersion skipping invalid object ${JSON.stringify(oID)}`, LOG.LS.eWF);
                continue;
            }

            // load asset version
            const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(oID.idObject);
            if (!assetVersion)  {
                LOG.error(`WorkflowEngine.eventIngestionUploadAssetVersion skipping invalid object ${JSON.stringify(oID)}`, LOG.LS.eWF);
                continue;
            }

            // load asset
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
            if (!asset) {
                LOG.error(`WorkflowEngine.eventIngestionUploadAssetVersion unable to load asset from idAsset ${assetVersion.idAsset}`, LOG.LS.eWF);
                continue;
            }

            // take appropriate workflow actions based on asset version type
            const eAssetType: CACHE.eVocabularyID | undefined = await asset.assetType();
            switch (eAssetType) {
                case CACHE.eVocabularyID.eAssetAssetTypeModel:
                case CACHE.eVocabularyID.eAssetAssetTypeModelGeometryFile: {
                    // initiate WorkflowJob for cook si-packrat-inspect
                    const parameters: WFP.WorkflowJobParameters =
                        new WFP.WorkflowJobParameters(CACHE.eVocabularyID.eJobJobTypeCookSIPackratInspect,
                            new COOK.JobCookSIPackratInspectParameters(assetVersion.FileName));

                    const wfParams: WF.WorkflowParameters = {
                        eWorkflowType: CACHE.eVocabularyID.eWorkflowTypeCookJob,
                        idSystemObject: [idSystemObject],
                        idProject: null,
                        idUserInitiator: null,
                        parameters,
                    };

                    workflow = await this.create(wfParams);
                    if (!workflow) {
                        LOG.error(`WorkflowEngine.eventIngestionUploadAssetVersion unable to create Cook si-packrat-inspect workflow: ${JSON.stringify(wfParams)}`, LOG.LS.eWF);
                        continue;
                    }
                } break;
            }
        }
        return workflow;
    }

    static computeWorkflowParameters(modelName: string, eWorkflowType: CACHE.eVocabularyID, eJobType: CACHE.eVocabularyID): any {
        switch (eWorkflowType) {
            case CACHE.eVocabularyID.eWorkflowTypeCookJob:
                return new WFP.WorkflowJobParameters(eJobType, new COOK.JobCookSIPackratInspectParameters(modelName));
            default:
                LOG.error(`WorkflowEngine.computeWorkflowParameters: unexpected workflow type ${CACHE.eVocabularyID[eWorkflowType]}`, LOG.LS.eWF);
        }
    }

    static async computeWorkflowIDFromEnum(eVocabEnum: CACHE.eVocabularyID, eVocabSetEnum: CACHE.eVocabularySetID): Promise<number | undefined> {
        const idVocab: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(eVocabEnum);
        if (!idVocab) {
            LOG.error(`WorkflowEngine.computeWorkflowTypeFromEnum called with invalid workflow type ${CACHE.eVocabularyID[eVocabEnum]}`, LOG.LS.eWF);
            return undefined;
        }
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eVocabEnum, eVocabSetEnum)) {
            LOG.error(`WorkflowEngine.computeWorkflowTypeFromEnum called with non-workflow type vocabulary ${CACHE.eVocabularyID[eVocabEnum]}`, LOG.LS.eWF);
            return undefined;
        }
        return idVocab;
    }

    static async computeWorkflowEnumFromID(idVocab: number, eVocabSetEnum: CACHE.eVocabularySetID): Promise<CACHE.eVocabularyID | undefined> {
        const eVocabEnum: CACHE.eVocabularyID | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(idVocab);
        if (!eVocabEnum) {
            LOG.error(`WorkflowEngine.computeWorkflowTypeEnumFromID called with invalid workflow type ${idVocab}`, LOG.LS.eWF);
            return undefined;
        }
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eVocabEnum, eVocabSetEnum)) {
            LOG.error(`WorkflowEngine.computeWorkflowTypeEnumFromID called with non-workflow type vocabulary ${CACHE.eVocabularyID[eVocabEnum]}`, LOG.LS.eWF);
            return undefined;
        }
        return eVocabEnum;
    }

    private async createDBObjects(workflowParams: WF.WorkflowParameters): Promise<DBAPI.WorkflowConstellation | null> {
        const WFC: DBAPI.WorkflowConstellation = new DBAPI.WorkflowConstellation();
        // *****************************************************
        // Workflow
        if (!workflowParams.eWorkflowType)
            return null;
        const idVWorkflowType: number | undefined = await WorkflowEngine.computeWorkflowIDFromEnum(workflowParams.eWorkflowType, CACHE.eVocabularySetID.eWorkflowType);
        if (!idVWorkflowType)
            return null;
        const dtNow: Date = new Date();

        WFC.workflow = new DBAPI.Workflow({
            idVWorkflowType,
            idProject: workflowParams.idProject,
            idUserInitiator: workflowParams.idUserInitiator,
            DateInitiated: dtNow,
            DateUpdated: dtNow,
            Parameters: workflowParams.parameters ? JSON.stringify(workflowParams.parameters) : null,
            idWorkflow: 0
        });
        if (!await WFC.workflow.create())
            return null;

        // *****************************************************
        // WorkflowStep for initiation
        const idVWorkflowStepType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(CACHE.eVocabularyID.eWorkflowStepTypeStart);
        if (!idVWorkflowStepType) {
            LOG.error(`WorkflowEngine.create called with invalid workflow type ${CACHE.eVocabularyID[workflowParams.eWorkflowType]}`, LOG.LS.eWF);
            return null;
        }

        const workflowStep: DBAPI.WorkflowStep = new DBAPI.WorkflowStep({
            idWorkflow: WFC.workflow.idWorkflow,
            idJobRun: null,
            idUserOwner: workflowParams.idUserInitiator,
            idVWorkflowStepType,
            State: DBAPI.WorkflowStep.stateEnumToValue(DBAPI.eWorkflowStepState.eCreated),
            DateCreated: dtNow,
            DateCompleted: dtNow,
            idWorkflowStep: 0
        });
        if (!await workflowStep.create())
            return null;
        WFC.workflowStep = [];
        WFC.workflowStep.push(workflowStep);

        // *****************************************************
        // WorkflowStepSystemObjectXref for linked system objects
        let workflowStepXref: DBAPI.WorkflowStepSystemObjectXref[] | null = null;
        if (workflowParams.idSystemObject) {
            workflowStepXref = [];
            for (const idSystemObject of workflowParams.idSystemObject) {
                const workflowStepSystemObjectXref: DBAPI.WorkflowStepSystemObjectXref = new DBAPI.WorkflowStepSystemObjectXref({
                    idWorkflowStep: workflowStep.idWorkflowStep,
                    idSystemObject,
                    Input: true,
                    idWorkflowStepSystemObjectXref: 0
                });
                if (await workflowStepSystemObjectXref.create())
                    workflowStepXref.push(workflowStepSystemObjectXref);
            }
        }
        WFC.workflowStepXref = workflowStepXref;
        return WFC;
    }

    private async fetchWorkflowImpl(workflowParams: WF.WorkflowParameters, WFC: DBAPI.WorkflowConstellation): Promise<WF.IWorkflow | null> {
        switch (workflowParams.eWorkflowType) {
            case CACHE.eVocabularyID.eWorkflowTypeCookJob: return await WorkflowJob.constructWorkflowJob(workflowParams, WFC);
        }
        return null;
    }
}
