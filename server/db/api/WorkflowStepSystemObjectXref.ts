/* eslint-disable camelcase */
import { WorkflowStepSystemObjectXref as WorkflowStepSystemObjectXrefBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class WorkflowStepSystemObjectXref extends DBC.DBObject<WorkflowStepSystemObjectXrefBase> implements WorkflowStepSystemObjectXrefBase {
    idWorkflowStepSystemObjectXref!: number;
    idSystemObject!: number;
    idWorkflowStep!: number;
    Input!: boolean;

    constructor(input: WorkflowStepSystemObjectXrefBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

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
            LOG.logger.error('DBAPI.WorkflowStepSystemObjectXref.create', error);
            return false;
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
            LOG.logger.error('DBAPI.WorkflowStepSystemObjectXref.update', error);
            return false;
        }
    }

    static async fetch(idWorkflowStepSystemObjectXref: number): Promise<WorkflowStepSystemObjectXref | null> {
        if (!idWorkflowStepSystemObjectXref)
            return null;
        try {
            return DBC.CopyObject<WorkflowStepSystemObjectXrefBase, WorkflowStepSystemObjectXref>(
                await DBC.DBConnection.prisma.workflowStepSystemObjectXref.findUnique({ where: { idWorkflowStepSystemObjectXref, }, }), WorkflowStepSystemObjectXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.WorkflowStepSystemObjectXref.fetch', error);
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
            LOG.logger.error('DBAPI.WorkflowStepSystemObjectXref.fetchFromWorkflowStep', error);
            return null;
        }
    }
}
