/* eslint-disable camelcase */
import { WorkflowStepSystemObjectXref as WorkflowStepSystemObjectXrefBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class WorkflowStepSystemObjectXref extends DBC.DBObject<WorkflowStepSystemObjectXrefBase> implements WorkflowStepSystemObjectXrefBase {
    idWorkflowStepSystemObjectXref!: number;
    idWorkflowStep!: number;
    idSystemObject!: number;
    Input!: boolean;

    constructor(input: WorkflowStepSystemObjectXrefBase) {
        super(input);
    }

    public fetchTableName(): string { return 'WorkflowStepSystemObjectXref'; }
    public fetchID(): number { return this.idWorkflowStepSystemObjectXref; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idWorkflowStep, idSystemObject, Input } = this;
            ({ idWorkflowStepSystemObjectXref: this.idWorkflowStepSystemObjectXref, idWorkflowStep: this.idWorkflowStep,
                idSystemObject: this.idSystemObject, Input: this.Input } =
                await DBC.DBConnection.prisma.workflowStepSystemObjectXref.create({
                    data: {
                        WorkflowStep: { connect: { idWorkflowStep }, },
                        SystemObject: { connect: { idSystemObject }, },
                        Input
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('create', error);
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idWorkflowStepSystemObjectXref, idWorkflowStep, idSystemObject, Input } = this;
            return await DBC.DBConnection.prisma.workflowStepSystemObjectXref.update({
                where: { idWorkflowStepSystemObjectXref, },
                data: {
                    WorkflowStep: { connect: { idWorkflowStep }, },
                    SystemObject: { connect: { idSystemObject }, },
                    Input
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('update', error);
        }
    }

    static async fetch(idWorkflowStepSystemObjectXref: number): Promise<WorkflowStepSystemObjectXref | null> {
        if (!idWorkflowStepSystemObjectXref)
            return null;
        try {
            return DBC.CopyObject<WorkflowStepSystemObjectXrefBase, WorkflowStepSystemObjectXref>(
                await DBC.DBConnection.prisma.workflowStepSystemObjectXref.findUnique({ where: { idWorkflowStepSystemObjectXref, }, }), WorkflowStepSystemObjectXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.WorkflowStepSystemObjectXref.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromWorkflowStep(idWorkflowStep: number): Promise<WorkflowStepSystemObjectXref[] | null> {
        if (!idWorkflowStep)
            return null;
        try {
            return DBC.CopyArray<WorkflowStepSystemObjectXrefBase, WorkflowStepSystemObjectXref>(
                await DBC.DBConnection.prisma.workflowStepSystemObjectXref.findMany({ where: { idWorkflowStep } }), WorkflowStepSystemObjectXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.WorkflowStepSystemObjectXref.fetchFromWorkflowStep', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromWorkflow(idWorkflow: number): Promise<WorkflowStepSystemObjectXref[] | null> {
        if (!idWorkflow)
            return null;
        try {
            const resWSX: WorkflowStepSystemObjectXref[] = [];
            const WSX: WorkflowStepSystemObjectXrefBase[] | null = // DBC.CopyArray<WorkflowStepSystemObjectXrefBase, WorkflowStepSystemObjectXref>(
                await DBC.DBConnection.prisma.$queryRaw<WorkflowStepSystemObjectXref[]>`
                SELECT WX.*
                FROM WorkflowStepSystemObjectXref AS WX
                JOIN WorkflowStep AS WS ON (WX.idWorkflowStep = WS.idWorkflowStep)
                WHERE WS.idWorkflow = ${idWorkflow}`; //, WorkflowStepSystemObjectXref);
            /* istanbul ignore else */
            if (WSX) {
                for (const xref of WSX) {
                    resWSX.push(new WorkflowStepSystemObjectXref({
                        idWorkflowStepSystemObjectXref: xref.idWorkflowStepSystemObjectXref,
                        idSystemObject: xref.idSystemObject,
                        idWorkflowStep: xref.idWorkflowStep,
                        Input: xref.Input ? true : false
                    }));
                }
            }
            return resWSX;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.WorkflowStepSystemObjectXref.fetchFromWorkflow', LOG.LS.eDB, error);
            return null;
        }
    }
}
