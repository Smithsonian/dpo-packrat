/* eslint-disable camelcase */
import { WorkflowTemplate as WorkflowTemplateBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class WorkflowTemplate extends DBC.DBObject<WorkflowTemplateBase> implements WorkflowTemplateBase {
    idWorkflowTemplate!: number;
    Name!: string;

    constructor(input: WorkflowTemplateBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name } = this;
            ({ idWorkflowTemplate: this.idWorkflowTemplate, Name: this.Name } =
                await DBC.DBConnection.prisma.workflowTemplate.create({ data: { Name, } }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.WorkflowTemplate.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idWorkflowTemplate, Name } = this;
            return await DBC.DBConnection.prisma.workflowTemplate.update({
                where: { idWorkflowTemplate, },
                data: { Name, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.WorkflowTemplate.update', error);
            return false;
        }
    }

    static async fetch(idWorkflowTemplate: number): Promise<WorkflowTemplate | null> {
        if (!idWorkflowTemplate)
            return null;
        try {
            return DBC.CopyObject<WorkflowTemplateBase, WorkflowTemplate>(
                await DBC.DBConnection.prisma.workflowTemplate.findOne({ where: { idWorkflowTemplate, }, }), WorkflowTemplate);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.WorkflowTemplate.fetch', error);
            return null;
        }
    }
}