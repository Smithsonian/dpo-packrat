/* eslint-disable camelcase */
import { Workflow as WorkflowBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Workflow extends DBC.DBObject<WorkflowBase> implements WorkflowBase {
    idWorkflow!: number;
    DateInitiated!: Date;
    DateUpdated!: Date;
    idProject!: number | null;
    idUserInitiator!: number | null;
    idWorkflowTemplate!: number;

    private idProjectOrig!: number | null;
    private idUserInitiatorOrig!: number | null;

    constructor(input: WorkflowBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idProjectOrig = this.idProject;
        this.idUserInitiatorOrig = this.idUserInitiator;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idWorkflowTemplate, idProject, idUserInitiator, DateInitiated, DateUpdated } = this;
            ({ idWorkflow: this.idWorkflow, idWorkflowTemplate: this.idWorkflowTemplate, idProject: this.idProject,
                idUserInitiator: this.idUserInitiator, DateInitiated: this.DateInitiated, DateUpdated: this.DateUpdated } =
                await DBC.DBConnectionFactory.prisma.workflow.create({
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
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Workflow.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idWorkflow, idWorkflowTemplate, idProject, idUserInitiator, DateInitiated,
                DateUpdated, idProjectOrig, idUserInitiatorOrig } = this;
            const retValue: boolean = await DBC.DBConnectionFactory.prisma.workflow.update({
                where: { idWorkflow, },
                data: {
                    WorkflowTemplate:   { connect: { idWorkflowTemplate }, },
                    Project:            idProject ? { connect: { idProject }, } : idProjectOrig ? { disconnect: true, } : undefined,
                    User:               idUserInitiator ? { connect: { idUser: idUserInitiator }, } : idUserInitiatorOrig ? { disconnect: true, } : undefined,
                    DateInitiated,
                    DateUpdated,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Workflow.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idWorkflow } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idWorkflow, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.workflow.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idWorkflow: number): Promise<Workflow | null> {
        if (!idWorkflow)
            return null;
        try {
            return DBC.CopyObject<WorkflowBase, Workflow>(
                await DBC.DBConnectionFactory.prisma.workflow.findOne({ where: { idWorkflow, }, }), Workflow);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Workflow.fetch', error);
            return null;
        }
    }

    static async fetchFromProject(idProject: number): Promise<Workflow[] | null> {
        if (!idProject)
            return null;
        try {
            return DBC.CopyArray<WorkflowBase, Workflow>(
                await DBC.DBConnectionFactory.prisma.workflow.findMany({ where: { idProject } }), Workflow);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Workflow.fetchFromProject', error);
            return null;
        }
    }

    static async fetchFromUser(idUserInitiator: number): Promise<Workflow[] | null> {
        if (!idUserInitiator)
            return null;
        try {
            return DBC.CopyArray<WorkflowBase, Workflow>(
                await DBC.DBConnectionFactory.prisma.workflow.findMany({ where: { idUserInitiator } }), Workflow);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Workflow.fetchFromUser', error);
            return null;
        }
    }

    static async fetchFromWorkflowTemplate(idWorkflowTemplate: number): Promise<Workflow[] | null> {
        if (!idWorkflowTemplate)
            return null;
        try {
            return DBC.CopyArray<WorkflowBase, Workflow>(
                await DBC.DBConnectionFactory.prisma.workflow.findMany({ where: { idWorkflowTemplate } }), Workflow);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Workflow.fetchFromWorkflowTemplate', error);
            return null;
        }
    }
}
