/**
 * Type resolver for WorkflowStep
 */
import { Vocabulary, Workflow, SystemObject, WorkflowStepSystemObjectXref } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const WorkflowStep = {
    Vocabulary: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idWorkflowStep } = parent;
        const { prisma } = context;

        return prisma.workflowStep.findOne({ where: { idWorkflowStep } }).Vocabulary();
    },
    Workflow: async (parent: Parent, _: Args, context: Context): Promise<Workflow | null> => {
        const { idWorkflowStep } = parent;
        const { prisma } = context;

        return prisma.workflowStep.findOne({ where: { idWorkflowStep } }).Workflow();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idWorkflowStep } = parent;
        const { prisma } = context;

        return prisma.workflowStep.findOne({ where: { idWorkflowStep } }).SystemObject();
    },
    WorkflowStepSystemObjectXref: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStepSystemObjectXref[] | null> => {
        const { idWorkflowStep } = parent;
        const { prisma } = context;

        return prisma.workflowStep.findOne({ where: { idWorkflowStep } }).WorkflowStepSystemObjectXref();
    }
};

export default WorkflowStep;
