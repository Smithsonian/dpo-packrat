/**
 * Type resolver for WorkflowStepSystemObjectXref
 */
import { SystemObject, WorkflowStep } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const WorkflowStepSystemObjectXref = {
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idWorkflowStepSystemObjectXref } = parent;
        const { prisma } = context;

        return prisma.workflowStepSystemObjectXref.findOne({ where: { idWorkflowStepSystemObjectXref: Number.parseInt(idWorkflowStepSystemObjectXref) } }).SystemObject();
    },
    WorkflowStep: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStep | null> => {
        const { idWorkflowStepSystemObjectXref } = parent;
        const { prisma } = context;

        return prisma.workflowStepSystemObjectXref.findOne({ where: { idWorkflowStepSystemObjectXref: Number.parseInt(idWorkflowStepSystemObjectXref) } }).WorkflowStep();
    }
};

export default WorkflowStepSystemObjectXref;
