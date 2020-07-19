/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { WorkflowStep as WorkflowStepBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class WorkflowStep extends DBC.DBObject<WorkflowStepBase> implements WorkflowStepBase {
    idWorkflowStep!: number;
    DateCompleted!: Date | null;
    DateCreated!: Date;
    idUserOwner!: number;
    idVWorkflowStepType!: number;
    idWorkflow!: number;
    State!: number;

    constructor(input: WorkflowStepBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { DateCompleted, DateCreated, idUserOwner, idVWorkflowStepType, idWorkflow, State } = this;
            ({ idWorkflowStep: this.idWorkflowStep, DateCompleted: this.DateCompleted, DateCreated: this.DateCreated,
                idUserOwner: this.idUserOwner, idVWorkflowStepType: this.idVWorkflowStepType,
                idWorkflow: this.idWorkflow, State: this.State } =
                await DBC.DBConnectionFactory.prisma.workflowStep.create({
                    data: {
                        Workflow:           { connect: { idWorkflow }, },
                        User:               { connect: { idUser: idUserOwner }, },
                        Vocabulary:         { connect: { idVocabulary: idVWorkflowStepType }, },
                        State,
                        DateCreated,
                        DateCompleted,
                        SystemObject:       { create: { Retired: false }, },
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
            const { idWorkflowStep, DateCompleted, DateCreated, idUserOwner, idVWorkflowStepType, idWorkflow, State } = this;
            return await DBC.DBConnectionFactory.prisma.workflowStep.update({
                where: { idWorkflowStep, },
                data: {
                    Workflow:           { connect: { idWorkflow }, },
                    User:               { connect: { idUser: idUserOwner }, },
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

    static async fetch(idWorkflowStep: number): Promise<WorkflowStep | null> {
        if (!idWorkflowStep)
            return null;
        try {
            return DBC.CopyObject<WorkflowStepBase, WorkflowStep>(
                await DBC.DBConnectionFactory.prisma.workflowStep.findOne({ where: { idWorkflowStep, }, }), WorkflowStep);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.WorkflowStep.fetch', error);
            return null;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idWorkflowStep } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne(
                    { where: { idWorkflowStep, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.WorkflowStep.fetchSystemObject', error);
            return null;
        }
    }

    async fetchSystemObjectFromXref(): Promise<SystemObject[] | null> {
        try {
            const { idWorkflowStep } = this;
            return DBC.CopyArray<SystemObjectBase, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findMany({
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
                await DBC.DBConnectionFactory.prisma.workflowStep.findMany({ where: { idUserOwner } }), WorkflowStep);
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
                await DBC.DBConnectionFactory.prisma.workflowStep.findMany({ where: { idWorkflow } }), WorkflowStep);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.WorkflowStep.fetchFromWorkflow', error);
            return null;
        }
    }
}
