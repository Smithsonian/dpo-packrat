/* eslint-disable camelcase */
import { Workflow as WorkflowBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { DBConnectionFactory, SystemObject } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class Workflow extends DBO.DBObject<WorkflowBase> implements WorkflowBase {
    idWorkflow!: number;
    DateInitiated!: Date;
    DateUpdated!: Date;
    idProject!: number | null;
    idUserInitiator!: number | null;
    idWorkflowTemplate!: number;

    constructor(input: WorkflowBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idWorkflowTemplate, idProject, idUserInitiator, DateInitiated, DateUpdated } = this;
            ({ idWorkflow: this.idWorkflow, idWorkflowTemplate: this.idWorkflowTemplate, idProject: this.idProject,
                idUserInitiator: this.idUserInitiator, DateInitiated: this.DateInitiated, DateUpdated: this.DateUpdated } =
                await DBConnectionFactory.prisma.workflow.create({
                    data: {
                        WorkflowTemplate:   { connect: { idWorkflowTemplate }, },
                        Project:            idProject ? { connect: { idProject }, } : undefined,
                        User:               idUserInitiator ? { connect: { idUser: idUserInitiator }, } : undefined,
                        DateInitiated,
                        DateUpdated,
                        SystemObject:       { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.Workflow.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idWorkflow, idWorkflowTemplate, idProject, idUserInitiator, DateInitiated, DateUpdated } = this;
            return await DBConnectionFactory.prisma.workflow.update({
                where: { idWorkflow, },
                data: {
                    WorkflowTemplate:   { connect: { idWorkflowTemplate }, },
                    Project:            idProject ? { connect: { idProject }, } : undefined,
                    User:               idUserInitiator ? { connect: { idUser: idUserInitiator }, } : undefined,
                    DateInitiated,
                    DateUpdated,
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.Workflow.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idWorkflow } = this;
            return DBO.CopyObject<SystemObjectBase, SystemObject>(
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idWorkflow, }, }), SystemObject);
        } catch (error) {
            LOG.logger.error('DBAPI.workflow.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idWorkflow: number): Promise<Workflow | null> {
        try {
            return DBO.CopyObject<WorkflowBase, Workflow>(
                await DBConnectionFactory.prisma.workflow.findOne({ where: { idWorkflow, }, }), Workflow);
        } catch (error) {
            LOG.logger.error('DBAPI.Workflow.fetch', error);
            return null;
        }
    }

    static async fetchFromProject(idProject: number): Promise<Workflow[] | null> {
        try {
            return DBO.CopyArray<WorkflowBase, Workflow>(
                await DBConnectionFactory.prisma.workflow.findMany({ where: { idProject } }), Workflow);
        } catch (error) {
            LOG.logger.error('DBAPI.Workflow.fetchFromProject', error);
            return null;
        }
    }

    static async fetchFromUser(idUserInitiator: number): Promise<Workflow[] | null> {
        try {
            return DBO.CopyArray<WorkflowBase, Workflow>(
                await DBConnectionFactory.prisma.workflow.findMany({ where: { idUserInitiator } }), Workflow);
        } catch (error) {
            LOG.logger.error('DBAPI.Workflow.fetchFromUser', error);
            return null;
        }
    }

    static async fetchFromWorkflowTemplate(idWorkflowTemplate: number): Promise<Workflow[] | null> {
        try {
            return DBO.CopyArray<WorkflowBase, Workflow>(
                await DBConnectionFactory.prisma.workflow.findMany({ where: { idWorkflowTemplate } }), Workflow);
        } catch (error) {
            LOG.logger.error('DBAPI.Workflow.fetchFromWorkflowTemplate', error);
            return null;
        }
    }
}
