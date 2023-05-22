/* eslint-disable camelcase */
import { WorkflowReport as WorkflowReportBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class WorkflowReport extends DBC.DBObject<WorkflowReportBase> implements WorkflowReportBase {
    idWorkflowReport!: number;
    idWorkflow!: number;
    MimeType!: string;
    Data!: string;
    Name!: string;

    constructor(input: WorkflowReportBase) {
        super(input);
    }

    public fetchTableName(): string { return 'WorkflowReport'; }
    public fetchID(): number { return this.idWorkflowReport; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idWorkflow, MimeType, Data, Name } = this;
            ({ idWorkflowReport: this.idWorkflowReport, idWorkflow: this.idWorkflow, MimeType: this.MimeType,
                Data: this.Data, Name: this.Name } =
                await DBC.DBConnection.prisma.workflowReport.create({
                    data: {
                        Workflow: { connect: { idWorkflow }, },
                        MimeType,
                        Data,
                        Name,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('create', error);
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idWorkflowReport, idWorkflow, MimeType, Data, Name } = this;
            return await DBC.DBConnection.prisma.workflowReport.update({
                where: { idWorkflowReport, },
                data: {
                    Workflow: { connect: { idWorkflow }, },
                    MimeType,
                    Data,
                    Name,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('update', error);
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

    static async fetchFromWorkflowSet(idWorkflowSet: number): Promise<WorkflowReport[] | null> {
        if (!idWorkflowSet)
            return null;
        try {
            return DBC.CopyArray<WorkflowReportBase, WorkflowReport>(
                await DBC.DBConnection.prisma.$queryRaw<WorkflowReport[]>`
                    SELECT WR.*
                    FROM WorkflowReport AS WR
                    JOIN Workflow AS W ON (WR.idWorkflow = W.idWorkflow)
                    JOIN WorkflowSet AS WS ON (W.idWorkflowSet = WS.idWorkflowSet)
                    WHERE WS.idWorkflowSet = ${idWorkflowSet}`, WorkflowReport);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.WorkflowReport.fetchFromWorkflowSet', LOG.LS.eDB, error);
            return null;
        }
    }
}
