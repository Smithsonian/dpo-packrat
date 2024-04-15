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

    static async fetchFromJobRun(idJobRun: number): Promise<WorkflowReport[] | null> {
        try {
            return DBC.CopyArray<WorkflowReportBase, WorkflowReport> (
                await DBC.DBConnection.prisma.$queryRaw<WorkflowReport[]>`
                SELECT w.* FROM JobRun AS jRun
                JOIN WorkflowStep AS wStep ON wStep.idJobRun = jRun.idJobRun
                JOIN WorkflowReport AS wReport ON wReport.idWorkflow = wStep.idWorkflow
                WHERE jRun.idJobRun = ${idJobRun};`,WorkflowReport);
        } catch (error) {
            LOG.error('DBAPI.WorkflowReport.fetchFromJobRun', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAllWithError(includeCancelled: boolean = false, includeUninitialized: boolean = false): Promise<WorkflowReport[] | null> {
        // return all reports that contain a step/job that has an error.
        // optionally include those cancelled or uninitialized.
        // TODO: check against JobRun.Result for additional possible errors
        try {
            return DBC.CopyArray<WorkflowReportBase, WorkflowReport> (
                await DBC.DBConnection.prisma.$queryRaw<WorkflowReport[]>`
                SELECT wReport.* FROM WorkflowStep AS wStep
                JOIN WorkflowReport AS wReport ON wStep.idWorkflow = wReport.idWorkflow
                JOIN JobRun AS jRun ON wStep.idJobRun = jRun.idJobRun
                JOIN Workflow AS w ON wStep.idWorkflow = w.idWorkflow
                WHERE (wStep.State = 5 ${(includeCancelled?'OR wStep.State = 6 ':'')}${includeUninitialized?'OR wStep.State = 0':''});`,WorkflowReport);
        } catch (error) {
            LOG.error('DBAPI.WorkflowReport.fetchAllWithError', LOG.LS.eDB, error);
            return null;
        }
    }
}
