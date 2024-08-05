/* eslint-disable camelcase */
import { WorkflowSet as WorkflowSetBase } from '@prisma/client';
import * as DBC from '../connection';
import * as DBAPI from '../';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import * as COMMON from '../../../common';

export class WorkflowSet extends DBC.DBObject<WorkflowSetBase> implements WorkflowSetBase {
    idWorkflowSet!: number;

    constructor(input: WorkflowSetBase) {
        super(input);
    }

    public fetchTableName(): string { return 'WorkflowSet'; }
    public fetchID(): number { return this.idWorkflowSet; }

    protected async createWorker(): Promise<boolean> {
        try {
            ({ idWorkflowSet: this.idWorkflowSet } = await DBC.DBConnection.prisma.workflowSet.create({ data: { } }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('create', error);
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idWorkflowSet } = this;
            return await DBC.DBConnection.prisma.workflowSet.update({
                where: { idWorkflowSet, },
                data: { },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('update', error);
        }
    }

    static async fetch(idWorkflowSet: number): Promise<WorkflowSet | null> {
        if (!idWorkflowSet)
            return null;
        try {
            return DBC.CopyObject<WorkflowSetBase, WorkflowSet>(
                await DBC.DBConnection.prisma.workflowSet.findUnique({ where: { idWorkflowSet, }, }), WorkflowSet);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.WorkflowSet.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromWorkflow(idWorkflow: number): Promise<WorkflowSet[] | null> {
        if (!idWorkflow)
            return null;
        try {
            return DBC.CopyArray<WorkflowSetBase, WorkflowSet>(
                await DBC.DBConnection.prisma.workflowSet.findMany({
                    where: {
                        Workflow: {
                            some: { idWorkflow },
                        },
                    },
                }), WorkflowSet);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.WorkflowSet.fetchFromWorkflow', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchStatus(idWorkflowSet: number): Promise<H.IOStatus> {
        // determines the general state of the WorkflowSet using eWorkflowJobRunStatus constant
        // if any 'step' within the set is a dominant property (error, running, etc.) then
        // the set assumes that status.
        const result: DBAPI.WorkflowStep[] | null = await DBAPI.WorkflowStep.fetchFromWorkflowSet(idWorkflowSet);
        if(!result || result.length===0)
            return { state: COMMON.eWorkflowJobRunStatus.eError, message: `cannot fetch WorkflowSteps (${idWorkflowSet})` };

        // our common response properties
        const steps: DBAPI.WorkflowStep[] = [...result];

        // cycle through all steps building up an understanding of the various states
        // if any are cancelled or have an error then that represents all of them and we return immediately
        let hasWaiting: boolean = false;
        let hasCreated: boolean = false;
        let hasRunning: boolean = false;
        for(let i=0; i<steps.length; i++) {
            // get our resolved status for the step so it includes the status of any associated JobRun
            // rationale: we are explicitly querying the DB to ensure we have the correct states/values
            //            as JobRun state propogation to WorkflowStep is not immediate and not always
            //            accurate. (e.g. often a JobRun has an Error but Step signals 'Done')
            // TODO: revisit core Workflow logic to identify/fix where states lose sync
            const storedStepState: COMMON.eWorkflowJobRunStatus = steps[i].getState();
            const stepStatus: H.IOStatus = await DBAPI.WorkflowStep.fetchStatus(steps[i].idWorkflowStep);
            LOG.info(`WorkflowSet.fetchStatus getting WorkflowStep state (${steps[i].idWorkflowStep}: ${COMMON.eWorkflowJobRunStatus[stepStatus.state]} | stored: ${COMMON.eWorkflowJobRunStatus[storedStepState]})`,LOG.LS.eDEBUG);

            switch(stepStatus.state) {
                case COMMON.eWorkflowJobRunStatus.eError:
                case COMMON.eWorkflowJobRunStatus.eCancelled:   return { state: stepStatus.state, message: 'set failed', data: result };

                case COMMON.eWorkflowJobRunStatus.eUnitialized:
                case COMMON.eWorkflowJobRunStatus.eCreated:     hasCreated = true; break;

                case COMMON.eWorkflowJobRunStatus.eRunning:     hasRunning = true; break;

                case COMMON.eWorkflowJobRunStatus.eWaiting:     hasWaiting = true; break;
            }
        }

        if(hasRunning)
            return { state: COMMON.eWorkflowJobRunStatus.eRunning, message: 'set has running', data: result };
        if(hasCreated)
            return { state: COMMON.eWorkflowJobRunStatus.eCreated, message: 'set has created', data: result };
        if(hasWaiting)
            return { state: COMMON.eWorkflowJobRunStatus.eWaiting, message: 'set is waiting', data: result };

        // if all are done then we set that as the status
        return { state: COMMON.eWorkflowJobRunStatus.eDone, message: 'set completed', data: result };
    }
}
