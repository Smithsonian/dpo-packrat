/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as WF from '../../interface';
import { WorkflowJob } from './WorkflowJob';
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';

export class WorkflowEngine implements WF.IWorkflowEngine {
    async create(workflowParams: WF.WorkflowParameters): Promise<WF.IWorkflow | null> {
        const WFC: DBAPI.WorkflowConstellation | null = await this.createDBObjects(workflowParams);
        if (!WFC)
            return null;

        const workflow: WF.IWorkflow | null = this.fetchWorkflowImpl(workflowParams.eWorkflowType, WFC);
        if (!workflow) {
            LOG.logger.error(`WorkflowEngine.create failed to fetch workflow implementation ${CACHE.eVocabularyID[workflowParams.eWorkflowType]}`);
            return null;
        }
        const startResults: H.IOResults = await workflow.start(workflowParams);
        if (!startResults) {
            LOG.logger.error(`WorkflowEngine.create failed to start workflow ${CACHE.eVocabularyID[workflowParams.eWorkflowType]}`);
            return null;
        }
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

        for (const workflowStep of workflowSteps) {
            await this.updateWorkflowStepFromJobRun(workflowStep, jobRun); // don't fail on update failures

            const WFC: DBAPI.WorkflowConstellation | null = await DBAPI.WorkflowConstellation.fetch(workflowStep.idWorkflow);
            if (!WFC || !WFC.workflow) {
                LOG.logger.error(`WorkflowEngine.jobUpdated (${idJobRun}) skipping orphan workflow step ${JSON.stringify(workflowStep)}`);
                continue;
            }

            // instantiate IWorkflow based on DB record, and forward updated event
            const eWorkflowType: CACHE.eVocabularyID | undefined = await this.computeWorkflowTypeEnumFromID(WFC.workflow.idVWorkflowType);
            if (!eWorkflowType)
                continue;

            const workflow: WF.IWorkflow | null = this.fetchWorkflowImpl(eWorkflowType, WFC);
            if (!workflow)
                continue;

            await workflow.update(workflowStep, jobRun);
        }
        return true;
    }

    private async computeWorkflowTypeFromEnum(eVocabEnum: CACHE.eVocabularyID): Promise<number | undefined> {
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

    private async computeWorkflowTypeEnumFromID(idVWorkflowType: number): Promise<CACHE.eVocabularyID | undefined> {
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
        const idVWorkflowType: number | undefined = await this.computeWorkflowTypeFromEnum(workflowParams.eWorkflowType);
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

    private async updateWorkflowStepFromJobRun(workflowStep: DBAPI.WorkflowStep, jobRun: DBAPI.JobRun): Promise<boolean> {
        // update workflowStep based on job run data
        const eWorkflowStepStateOrig: DBAPI.eWorkflowStepState = workflowStep.getState();
        let eWorkflowStepState: DBAPI.eWorkflowStepState = eWorkflowStepStateOrig;
        const dateCompletedOrig: Date | null = workflowStep.DateCompleted;
        let dateCompleted: Date | null = dateCompletedOrig;
        let updateNeeded: boolean = false;

        switch (jobRun.getStatus()) {
            case DBAPI.eJobRunStatus.eUnitialized:
            case DBAPI.eJobRunStatus.eCreated:
                eWorkflowStepState = DBAPI.eWorkflowStepState.eCreated;
                break;
            case DBAPI.eJobRunStatus.eRunning:
            case DBAPI.eJobRunStatus.eWaiting:
                eWorkflowStepState = DBAPI.eWorkflowStepState.eStarted;
                break;
            case DBAPI.eJobRunStatus.eDone:
            case DBAPI.eJobRunStatus.eError:
            case DBAPI.eJobRunStatus.eCancelled:
                eWorkflowStepState = DBAPI.eWorkflowStepState.eFinished;
                dateCompleted = new Date();
                break;
        }

        if (eWorkflowStepState != eWorkflowStepStateOrig) {
            workflowStep.setState(eWorkflowStepState);
            updateNeeded = true;
        }

        if (dateCompleted != dateCompletedOrig) {
            workflowStep.DateCompleted = dateCompleted;
            updateNeeded = true;
        }

        return (updateNeeded) ? await workflowStep.update() : true;
    }

    private fetchWorkflowImpl(eWorkflowType: CACHE.eVocabularyID, WFC: DBAPI.WorkflowConstellation): WF.IWorkflow | null {
        let workflow: WF.IWorkflow | null = null;
        switch (eWorkflowType) {
            case CACHE.eVocabularyID.eWorkflowTypeCookJob:
                workflow = new WorkflowJob(WFC);
                break;
        }
        return workflow;
    }
}
