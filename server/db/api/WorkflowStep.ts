/* eslint-disable camelcase */
import { WorkflowStep as WorkflowStepBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject, convertWorkflowJobRunStatusToEnum } from '..';
import * as DBC from '../connection';
import * as DBAPI from '../';
import * as H from '../../utils/helpers';
import * as COMMON from '@dpo-packrat/common';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class WorkflowStep extends DBC.DBObject<WorkflowStepBase> implements WorkflowStepBase {
    idWorkflowStep!: number;
    idWorkflow!: number;
    idJobRun!: number | null;
    idUserOwner!: number | null;
    idVWorkflowStepType!: number;
    State!: number;     // defined in common/constants.ts (ln. 409)
    DateCreated!: Date;
    DateCompleted!: Date | null;

    constructor(input: WorkflowStepBase) {
        super(input);
    }

    public fetchTableName(): string { return 'WorkflowStep'; }
    public fetchID(): number { return this.idWorkflowStep; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idJobRun, DateCompleted, DateCreated, idUserOwner, idVWorkflowStepType, idWorkflow, State } = this;
            ({ idWorkflowStep: this.idWorkflowStep, DateCompleted: this.DateCompleted, DateCreated: this.DateCreated,
                idUserOwner: this.idUserOwner, idVWorkflowStepType: this.idVWorkflowStepType,
                idWorkflow: this.idWorkflow, State: this.State } =
                await DBC.DBConnection.prisma.workflowStep.create({
                    data: {
                        JobRun:             idJobRun ? { connect: { idJobRun }, } : undefined,
                        Workflow:           { connect: { idWorkflow }, },
                        User:               idUserOwner ? { connect: { idUser: idUserOwner }, } : undefined,
                        Vocabulary:         { connect: { idVocabulary: idVWorkflowStepType }, },
                        State,
                        DateCreated,
                        DateCompleted,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.Workflow.Step');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idWorkflowStep, idJobRun, DateCompleted, DateCreated, idUserOwner, idVWorkflowStepType,
                idWorkflow, State } = this;
            return await DBC.DBConnection.prisma.workflowStep.update({
                where: { idWorkflowStep, },
                data: {
                    JobRun:             idJobRun ? { connect: { idJobRun }, } : { disconnect: true, },
                    Workflow:           { connect: { idWorkflow }, },
                    User:               idUserOwner ? { connect: { idUser: idUserOwner }, } : { disconnect: true, },
                    Vocabulary:         { connect: { idVocabulary: idVWorkflowStepType }, },
                    State,
                    DateCreated,
                    DateCompleted,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.Workflow.Step');
            return  false;
        }
    }

    getState(): COMMON.eWorkflowJobRunStatus {
        return convertWorkflowJobRunStatusToEnum(this.State);
    }
    setState(eState: COMMON.eWorkflowJobRunStatus): void {
        this.State = eState;
    }

    static async fetch(idWorkflowStep: number): Promise<WorkflowStep | null> {
        if (!idWorkflowStep)
            return null;
        try {
            return DBC.CopyObject<WorkflowStepBase, WorkflowStep>(
                await DBC.DBConnection.prisma.workflowStep.findUnique({ where: { idWorkflowStep, }, }), WorkflowStep);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.Workflow.Step');
            return null;
        }
    }

    async fetchSystemObjectFromXref(): Promise<SystemObject[] | null> {
        try {
            const { idWorkflowStep } = this;
            return DBC.CopyArray<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findMany({
                    where: {
                        WorkflowStepSystemObjectXref: {
                            some: { idWorkflowStep },
                        },
                    },
                }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch SystemObject from xref failed',H.Helpers.getErrorString(error),{ ...this },'DB.Workflow.Step');
            return null;
        }
    }

    static async fetchFromUser(idUserOwner: number): Promise<WorkflowStep[] | null> {
        if (!idUserOwner)
            return null;
        try {
            return DBC.CopyArray<WorkflowStepBase, WorkflowStep>(
                await DBC.DBConnection.prisma.workflowStep.findMany({ where: { idUserOwner } }), WorkflowStep);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from User failed',H.Helpers.getErrorString(error),{ ...this },'DB.Workflow.Step');
            return null;
        }
    }

    static async fetchFromWorkflow(idWorkflow: number): Promise<WorkflowStep[] | null> {
        if (!idWorkflow)
            return null;
        try {
            return DBC.CopyArray<WorkflowStepBase, WorkflowStep>(
                await DBC.DBConnection.prisma.workflowStep.findMany({ where: { idWorkflow } }), WorkflowStep);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from Workflow failed',H.Helpers.getErrorString(error),{ ...this },'DB.Workflow.Step');
            return null;
        }
    }

    static async fetchFromJobRun(idJobRun: number): Promise<WorkflowStep[] | null> {
        if (!idJobRun)
            return null;
        try {
            return DBC.CopyArray<WorkflowStepBase, WorkflowStep>(
                await DBC.DBConnection.prisma.workflowStep.findMany({ where: { idJobRun } }), WorkflowStep);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from JobRun failed',H.Helpers.getErrorString(error),{ ...this },'DB.Workflow.Step');
            return null;
        }
    }

    static async fetchFromWorkflowSet(idWorkflowSet: number): Promise<WorkflowStep[] | null> {
        if (!idWorkflowSet)
            return null;
        try {
            const steps: WorkflowStep[] | null = await DBC.CopyArray<WorkflowStepBase, WorkflowStep>(
                await DBC.DBConnection.prisma.$queryRaw<WorkflowStep[]>`
                SELECT wfStep.* FROM WorkflowSet AS wfSet
                JOIN Workflow AS wf ON wf.idWorkflowSet = wfSet.idWorkflowSet
                JOIN WorkflowStep AS wfStep ON wfStep.idWorkflow = wf.idWorkflow
                WHERE wfSet.idWorkflowSet = ${idWorkflowSet};`
                , WorkflowStep);

            if(steps)
                return steps;
            return null;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from WorkflowSet failed',H.Helpers.getErrorString(error),{ ...this },'DB.Workflow.Step');
            return null;
        }
    }

    static async fetchStatus(idWorkflowStep: number): Promise<H.IOStatus> {
        // returns the resolved status taking into account any derived processes and their state
        // rationale: DB is source of truth, maintains Parent 'knows' child philosophy
        const workflowStep: WorkflowStep | null = await this.fetch(idWorkflowStep);
        if(!workflowStep) {
            RK.logError(RK.LogSection.eDB,'fetch status failed',`failed to find WorkflowStep: ${idWorkflowStep}`,{ ...this },'DB.Workflow.Step');
            return { state: COMMON.eWorkflowJobRunStatus.eError, message: `cannot fetch WorkflowStep (${idWorkflowStep})` };
        }

        // if there is a JobRun use that for the status going back
        // since WorkflowStep doesn't inherit from it and a step can be 'Done' but have an error
        if(workflowStep.idJobRun) {
            const jobRun: DBAPI.JobRun | null = await DBAPI.JobRun.fetch(workflowStep.idJobRun);
            if(jobRun) {
                return { state: jobRun.Status, message: `WorkflowStep (JobRun) status: ${COMMON.eWorkflowJobRunStatus[jobRun.Status]}.` };
            }
        }

        // otherwise use the workflow step's stored state
        return { state: workflowStep.State, message: `WorkflowStep status: ${workflowStep.State}` };
    }
}
