/* eslint-disable camelcase */
import { WorkflowTemplate as WorkflowTemplateBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class WorkflowTemplate extends DBO.DBObject<WorkflowTemplateBase> implements WorkflowTemplateBase {
    idWorkflowTemplate!: number;
    Name!: string;

    constructor(input: WorkflowTemplateBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { Name } = this;
            ({ idWorkflowTemplate: this.idWorkflowTemplate, Name: this.Name } =
                await DBConnectionFactory.prisma.workflowTemplate.create({ data: { Name, } }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.WorkflowTemplate.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idWorkflowTemplate, Name } = this;
            return await DBConnectionFactory.prisma.workflowTemplate.update({
                where: { idWorkflowTemplate, },
                data: { Name, },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.WorkflowTemplate.update', error);
            return false;
        }
    }

    static async fetch(idWorkflowTemplate: number): Promise<WorkflowTemplate | null> {
        if (!idWorkflowTemplate)
            return null;
        try {
            return DBO.CopyObject<WorkflowTemplateBase, WorkflowTemplate>(
                await DBConnectionFactory.prisma.workflowTemplate.findOne({ where: { idWorkflowTemplate, }, }), WorkflowTemplate);
        } catch (error) {
            LOG.logger.error('DBAPI.WorkflowTemplate.fetch', error);
            return null;
        }
    }
}