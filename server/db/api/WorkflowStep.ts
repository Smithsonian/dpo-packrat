/* eslint-disable camelcase */
import { WorkflowStep as WorkflowStepBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { DBConnectionFactory, SystemObject } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class WorkflowStep extends DBO.DBObject<WorkflowStepBase> implements WorkflowStepBase {
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

    async create(): Promise<boolean> {
        try {
            const { DateCompleted, DateCreated, idUserOwner, idVWorkflowStepType, idWorkflow, State } = this;
            ({ idWorkflowStep: this.idWorkflowStep, DateCompleted: this.DateCompleted, DateCreated: this.DateCreated,
                idUserOwner: this.idUserOwner, idVWorkflowStepType: this.idVWorkflowStepType,
                idWorkflow: this.idWorkflow, State: this.State } =
                await DBConnectionFactory.prisma.workflowStep.create({
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
        } catch (error) {
            LOG.logger.error('DBAPI.WorkflowStep.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idWorkflowStep, DateCompleted, DateCreated, idUserOwner, idVWorkflowStepType, idWorkflow, State } = this;
            return await DBConnectionFactory.prisma.workflowStep.update({
                where: { idWorkflowStep, },
                data: {
                    Workflow:           { connect: { idWorkflow }, },
                    User:               { connect: { idUser: idUserOwner }, },
                    Vocabulary:         { connect: { idVocabulary: idVWorkflowStepType }, },
                    State,
                    DateCreated,
                    DateCompleted,
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.WorkflowStep.update', error);
            return false;
        }
    }

    static async fetch(idWorkflowStep: number): Promise<WorkflowStep | null> {
        try {
            return DBO.CopyObject<WorkflowStepBase, WorkflowStep>(
                await DBConnectionFactory.prisma.workflowStep.findOne({ where: { idWorkflowStep, }, }), WorkflowStep);
        } catch (error) {
            LOG.logger.error('DBAPI.WorkflowStep.fetch', error);
            return null;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idWorkflowStep } = this;
            return DBO.CopyObject<SystemObjectBase, SystemObject>(
                await DBConnectionFactory.prisma.systemObject.findOne(
                    { where: { idWorkflowStep, }, }), SystemObject);
        } catch (error) {
            LOG.logger.error('DBAPI.WorkflowStep.fetchSystemObject', error);
            return null;
        }
    }

    async fetchSystemObjectFromXref(): Promise<SystemObject[] | null> {
        try {
            const { idWorkflowStep } = this;
            return DBO.CopyArray<SystemObjectBase, SystemObject>(
                await DBConnectionFactory.prisma.systemObject.findMany({
                    where: {
                        WorkflowStepSystemObjectXref: {
                            some: { idWorkflowStep },
                        },
                    },
                }), SystemObject);
        } catch (error) {
            LOG.logger.error('DBAPI.WorkflowStep.fetchSystemObjectFromXref', error);
            return null;
        }
    }

    static async fetchFromUser(idUserOwner: number): Promise<WorkflowStep[] | null> {
        try {
            return DBO.CopyArray<WorkflowStepBase, WorkflowStep>(
                await DBConnectionFactory.prisma.workflowStep.findMany({ where: { idUserOwner } }), WorkflowStep);
        } catch (error) {
            LOG.logger.error('DBAPI.WorkflowStep.fetchFromUser', error);
            return null;
        }
    }

    static async fetchFromWorkflow(idWorkflow: number): Promise<WorkflowStep[] | null> {
        try {
            return DBO.CopyArray<WorkflowStepBase, WorkflowStep>(
                await DBConnectionFactory.prisma.workflowStep.findMany({ where: { idWorkflow } }), WorkflowStep);
        } catch (error) {
            LOG.logger.error('DBAPI.WorkflowStep.fetchFromWorkflow', error);
            return null;
        }
    }
}
