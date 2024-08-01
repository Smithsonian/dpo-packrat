/* eslint-disable camelcase */
import { WorkflowStep as WorkflowStepBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject, convertWorkflowJobRunStatusToEnum } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';
import * as COMMON from '@dpo-packrat/common';

export class WorkflowStep extends DBC.DBObject<WorkflowStepBase> implements WorkflowStepBase {
    idWorkflowStep!: number;
    idWorkflow!: number;
    idJobRun!: number | null;
    idUserOwner!: number | null;
    idVWorkflowStepType!: number;
    State!: number;
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
            return this.logError('create', error);
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
            return this.logError('update', error);
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
            LOG.error('DBAPI.WorkflowStep.fetch', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.WorkflowStep.fetchSystemObjectFromXref', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.WorkflowStep.fetchFromUser', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.WorkflowStep.fetchFromWorkflow', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.WorkflowStep.fetchFromJobRun', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.WorkflowStep.fetchFromWorkflowSet', LOG.LS.eDB, error);
            return null;
        }
    }
}
