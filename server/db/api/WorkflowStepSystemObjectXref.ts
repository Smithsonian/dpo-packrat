/* eslint-disable camelcase */
import { WorkflowStepSystemObjectXref as WorkflowStepSystemObjectXrefBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class WorkflowStepSystemObjectXref extends DBO.DBObject<WorkflowStepSystemObjectXrefBase> implements WorkflowStepSystemObjectXrefBase {
    idWorkflowStepSystemObjectXref!: number;
    idSystemObject!: number;
    idWorkflowStep!: number;
    Input!: boolean;

    constructor(input: WorkflowStepSystemObjectXrefBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idWorkflowStep, idSystemObject, Input } = this;
            ({ idWorkflowStepSystemObjectXref: this.idWorkflowStepSystemObjectXref, idWorkflowStep: this.idWorkflowStep,
                idSystemObject: this.idSystemObject, Input: this.Input } =
                await DBConnectionFactory.prisma.workflowStepSystemObjectXref.create({
                    data: {
                        WorkflowStep: { connect: { idWorkflowStep }, },
                        SystemObject: { connect: { idSystemObject }, },
                        Input
                    },
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.WorkflowStepSystemObjectXref.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idWorkflowStepSystemObjectXref, idWorkflowStep, idSystemObject, Input } = this;
            return await DBConnectionFactory.prisma.workflowStepSystemObjectXref.update({
                where: { idWorkflowStepSystemObjectXref, },
                data: {
                    WorkflowStep: { connect: { idWorkflowStep }, },
                    SystemObject: { connect: { idSystemObject }, },
                    Input
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.WorkflowStepSystemObjectXref.update', error);
            return false;
        }
    }

    static async fetch(idWorkflowStepSystemObjectXref: number): Promise<WorkflowStepSystemObjectXref | null> {
        if (!idWorkflowStepSystemObjectXref)
            return null;
        try {
            return DBO.CopyObject<WorkflowStepSystemObjectXrefBase, WorkflowStepSystemObjectXref>(
                await DBConnectionFactory.prisma.workflowStepSystemObjectXref.findOne({ where: { idWorkflowStepSystemObjectXref, }, }), WorkflowStepSystemObjectXref);
        } catch (error) {
            LOG.logger.error('DBAPI.WorkflowStepSystemObjectXref.fetch', error);
            return null;
        }
    }

    static async fetchFromWorkflowStep(idWorkflowStep: number): Promise<WorkflowStepSystemObjectXref[] | null> {
        if (!idWorkflowStep)
            return null;
        try {
            return DBO.CopyArray<WorkflowStepSystemObjectXrefBase, WorkflowStepSystemObjectXref>(
                await DBConnectionFactory.prisma.workflowStepSystemObjectXref.findMany({ where: { idWorkflowStep } }), WorkflowStepSystemObjectXref);
        } catch (error) {
            LOG.logger.error('DBAPI.WorkflowStepSystemObjectXref.fetchFromWorkflowStep', error);
            return null;
        }
    }
}
