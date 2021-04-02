/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as WF from '../../interface';
import { WorkflowJob } from './WorkflowJob';
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';

export class WorkflowEngine implements WF.IWorkflowEngine {
    private workflowMap: Map<number, WF.IWorkflow> = new Map<number, WF.IWorkflow>();

    async create(workflowParams: WF.WorkflowParameters): Promise<WF.IWorkflow | null> {
        LOG.logger.info(`WorkflowEngine.create workflow [${this.workflowMap.size}]: ${JSON.stringify(workflowParams)}`);
        const WFC: DBAPI.WorkflowConstellation | null = await this.createDBObjects(workflowParams);
        if (!WFC)
            return null;

        const workflow: WF.IWorkflow | null = await this.fetchWorkflowImpl(workflowParams, WFC);
        if (!workflow) {
            LOG.logger.error(`WorkflowEngine.create failed to fetch workflow implementation ${CACHE.eVocabularyID[workflowParams.eWorkflowType]}`);
            return null;
        }
        if (WFC.workflow)
            this.workflowMap.set(WFC.workflow.idWorkflow, workflow);
        const startResults: H.IOResults = await workflow.start();
        if (!startResults) {
            LOG.logger.error(`WorkflowEngine.create failed to start workflow ${CACHE.eVocabularyID[workflowParams.eWorkflowType]}`);
            return null;
        }
        LOG.logger.info(`WorkflowEngine.created workflow [${this.workflowMap.size}]: ${JSON.stringify(workflowParams)}`);
        return workflow;
    }

    async jobUpdated(idJobRun: number): Promise<boolean> {
        LOG.logger.info(`WorkflowEngine.jobUpdated: ${idJobRun}`);

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
                LOG.logger.error(`WorkflowEngine.jobUpdated (${idJobRun}) skipping orphan workflow step ${JSON.stringify(workflowStep)}`);
                continue;
            }

            // lookup workflow object and forward "updated" event
            const workflow: WF.IWorkflow | undefined = this.workflowMap.get(WFC.workflow.idWorkflow);
            if (!workflow) {
                LOG.logger.error(`WorkflowEngine.jobUpdated(${idJobRun}) unable to locate workflow ${WFC.workflow.idWorkflow}`);
                continue;
            }

            const updateRes: WF.WorkflowUpdateResults = await workflow.update(workflowStep, jobRun);
            if (updateRes.workflowComplete) {
                this.workflowMap.delete(WFC.workflow.idWorkflow);
                LOG.logger.info(`WorkflowEngine.jobUpdated completed workflow [${this.workflowMap.size}]: ${idJobRun}`);
            }
            result = updateRes.success && result;
        }
        return result;
    }

    static async computeWorkflowTypeFromEnum(eVocabEnum: CACHE.eVocabularyID): Promise<number | undefined> {
        const idVWorkflowType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(eVocabEnum);
        if (!idVWorkflowType) {
            LOG.logger.error(`WorkflowEngine.computeWorkflowTypeFromEnum called with invalid workflow type ${CACHE.eVocabularyID[eVocabEnum]}`);
            return undefined;
        }
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eVocabEnum, CACHE.eVocabularySetID.eWorkflowType)) {
            LOG.logger.error(`WorkflowEngine.computeWorkflowTypeFromEnum called with non-workflow type vocabulary ${CACHE.eVocabularyID[eVocabEnum]}`);
            return undefined;
        }
        return idVWorkflowType;
    }

    static async computeWorkflowTypeEnumFromID(idVWorkflowType: number): Promise<CACHE.eVocabularyID | undefined> {
        const eVocabEnum: CACHE.eVocabularyID | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(idVWorkflowType);
        if (!eVocabEnum) {
            LOG.logger.error(`WorkflowEngine.computeWorkflowTypeEnumFromID called with invalid workflow type ${idVWorkflowType}`);
            return undefined;
        }
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eVocabEnum, CACHE.eVocabularySetID.eWorkflowType)) {
            LOG.logger.error(`WorkflowEngine.computeWorkflowTypeEnumFromID called with non-workflow type vocabulary ${CACHE.eVocabularyID[eVocabEnum]}`);
            return undefined;
        }
        return eVocabEnum;
    }

    private async createDBObjects(workflowParams: WF.WorkflowParameters): Promise<DBAPI.WorkflowConstellation | null> {
        const WFC: DBAPI.WorkflowConstellation = new DBAPI.WorkflowConstellation();
        // *****************************************************
        // Workflow
        const idVWorkflowType: number | undefined = await WorkflowEngine.computeWorkflowTypeFromEnum(workflowParams.eWorkflowType);
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
            LOG.logger.error(`WorkflowEngine.create called with invalid workflow type ${CACHE.eVocabularyID[workflowParams.eWorkflowType]}`);
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
