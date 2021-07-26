/* eslint-disable camelcase */
import { WorkflowSet as WorkflowSetBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class WorkflowSet extends DBC.DBObject<WorkflowSetBase> implements WorkflowSetBase {
    idWorkflowSet!: number;

    constructor(input: WorkflowSetBase) {
        super(input);
    }

    public fetchTableName(): string { return 'WorkflowSet'; }
    public fetchID(): number { return this.idWorkflowSet; }

    protected async createWorker(): Promise<boolean> {
        try {
            ({ idWorkflowSet: this.idWorkflowSet } = await DBC.DBConnection.prisma.workflowSet.create({ data: { } }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.WorkflowSet.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idWorkflowSet } = this;
            return await DBC.DBConnection.prisma.workflowSet.update({
                where: { idWorkflowSet, },
                data: { },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.WorkflowSet.update', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idWorkflowSet: number): Promise<WorkflowSet | null> {
        if (!idWorkflowSet)
            return null;
        try {
            return DBC.CopyObject<WorkflowSetBase, WorkflowSet>(
                await DBC.DBConnection.prisma.workflowSet.findUnique({ where: { idWorkflowSet, }, }), WorkflowSet);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.WorkflowSet.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromWorkflow(idWorkflow: number): Promise<WorkflowSet[] | null> {
        if (!idWorkflow)
            return null;
        try {
            return DBC.CopyArray<WorkflowSetBase, WorkflowSet>(
                await DBC.DBConnection.prisma.workflowSet.findMany({
                    where: {
                        Workflow: {
                            some: { idWorkflow },
                        },
                    },
                }), WorkflowSet);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.WorkflowSet.fetchFromWorkflow', LOG.LS.eDB, error);
            return null;
        }
    }
}
