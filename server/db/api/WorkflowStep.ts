/* eslint-disable camelcase */
import { WorkflowStep as WorkflowStepBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export enum eWorkflowStepState {
    eCreated,
    eStarted,
    eFinished,
}

export class WorkflowStep extends DBC.DBObject<WorkflowStepBase> implements WorkflowStepBase {
    idWorkflowStep!: number;
    idWorkflow!: number;
    idJobRun!: number | null;
    idUserOwner!: number | null;
    idVWorkflowStepType!: number;
    State!: number;
    DateCreated!: Date;
    DateCompleted!: Date | null;

    idJobRunOrig!: number | null;
    idUserOwnerOrig!: number | null;

    constructor(input: WorkflowStepBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idJobRunOrig = this.idJobRun;
        this.idUserOwnerOrig = this.idUserOwner;
    }

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
            LOG.logger.error('DBAPI.WorkflowStep.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idWorkflowStep, idJobRun, DateCompleted, DateCreated, idUserOwner, idVWorkflowStepType,
                idWorkflow, State, idJobRunOrig, idUserOwnerOrig } = this;
            return await DBC.DBConnection.prisma.workflowStep.update({
                where: { idWorkflowStep, },
                data: {
                    JobRun:             idJobRun ? { connect: { idJobRun }, } : idJobRunOrig ? { disconnect: true, } : undefined,
                    Workflow:           { connect: { idWorkflow }, },
                    User:               idUserOwner ? { connect: { idUser: idUserOwner }, } : idUserOwnerOrig ? { disconnect: true, } : undefined,
                    Vocabulary:         { connect: { idVocabulary: idVWorkflowStepType }, },
                    State,
                    DateCreated,
                    DateCompleted,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.WorkflowStep.update', error);
            return false;
        }
    }

    static stateValueToEnum(State: number): eWorkflowStepState {
        switch (State) {
            default:
            case 0: return eWorkflowStepState.eCreated;
            case 1: return eWorkflowStepState.eStarted;
            case 2: return eWorkflowStepState.eFinished;
        }
    }
    static stateEnumToValue(eState: eWorkflowStepState): number {
        switch (eState) {
            case eWorkflowStepState.eCreated: return 0;
            case eWorkflowStepState.eStarted: return 1;
            case eWorkflowStepState.eFinished: return 2;
        }
    }

    getState(): eWorkflowStepState {
        return WorkflowStep.stateValueToEnum(this.State);
    }
    setState(eState: eWorkflowStepState): void {
        this.State = WorkflowStep.stateEnumToValue(eState);
    }

    static async fetch(idWorkflowStep: number): Promise<WorkflowStep | null> {
        if (!idWorkflowStep)
            return null;
        try {
            return DBC.CopyObject<WorkflowStepBase, WorkflowStep>(
                await DBC.DBConnection.prisma.workflowStep.findUnique({ where: { idWorkflowStep, }, }), WorkflowStep);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.WorkflowStep.fetch', error);
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
            LOG.logger.error('DBAPI.WorkflowStep.fetchSystemObjectFromXref', error);
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
            LOG.logger.error('DBAPI.WorkflowStep.fetchFromUser', error);
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
            LOG.logger.error('DBAPI.WorkflowStep.fetchFromWorkflow', error);
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
            LOG.logger.error('DBAPI.WorkflowStep.fetchFromJobRun', error);
            return null;
        }
    }
}
