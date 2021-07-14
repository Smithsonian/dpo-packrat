/* eslint-disable camelcase */
import { WorkflowReport as WorkflowReportBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class WorkflowReport extends DBC.DBObject<WorkflowReportBase> implements WorkflowReportBase {
    idWorkflowReport!: number;
    idWorkflow!: number;
    MimeType!: string;
    Data!: string;

    constructor(input: WorkflowReportBase) {
        super(input);
    }

    public fetchTableName(): string { return 'WorkflowReport'; }
    public fetchID(): number { return this.idWorkflowReport; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idWorkflow, MimeType, Data } = this;
            ({ idWorkflowReport: this.idWorkflowReport, idWorkflow: this.idWorkflow, MimeType: this.MimeType,
                Data: this.Data } =
                await DBC.DBConnection.prisma.workflowReport.create({
                    data: {
                        Workflow: { connect: { idWorkflow }, },
                        MimeType,
                        Data,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.WorkflowReport.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idWorkflowReport, idWorkflow, MimeType, Data } = this;
            return await DBC.DBConnection.prisma.workflowReport.update({
                where: { idWorkflowReport, },
                data: {
                    Workflow: { connect: { idWorkflow }, },
                    MimeType,
                    Data,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.WorkflowReport.update', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idWorkflowReport: number): Promise<WorkflowReport | null> {
        if (!idWorkflowReport)
            return null;
        try {
            return DBC.CopyObject<WorkflowReportBase, WorkflowReport>(
                await DBC.DBConnection.prisma.workflowReport.findUnique({ where: { idWorkflowReport, }, }), WorkflowReport);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.WorkflowReport.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromWorkflow(idWorkflow: number): Promise<WorkflowReport[] | null> {
        if (!idWorkflow)
            return null;
        try {
            return DBC.CopyArray<WorkflowReportBase, WorkflowReport>(
                await DBC.DBConnection.prisma.workflowReport.findMany({ where: { idWorkflow } }), WorkflowReport);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.WorkflowReport.fetchFromWorkflow', LOG.LS.eDB, error);
            return null;
        }
    }
}
