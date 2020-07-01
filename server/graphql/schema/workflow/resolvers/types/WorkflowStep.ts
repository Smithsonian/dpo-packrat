/**
 * Type resolver for WorkflowStep
 */
import { User, Vocabulary, Workflow, SystemObject, WorkflowStepSystemObjectXref } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const WorkflowStep = {
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idUserOwner } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUser(prisma, idUserOwner);
    },
    Vocabulary: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVWorkflowStepType } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVWorkflowStepType);
    },
    Workflow: async (parent: Parent, _: Args, context: Context): Promise<Workflow | null> => {
        const { idWorkflow } = parent;
        const { prisma } = context;

        return await DBAPI.fetchWorkflow(prisma, idWorkflow);
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idWorkflowStep } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObjectFromWorkflowStep(prisma, idWorkflowStep);
    },
    WorkflowStepSystemObjectXref: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStepSystemObjectXref[] | null> => {
        const { idWorkflowStep } = parent;
        const { prisma } = context;
        // TODO: xref elimination
        return prisma.workflowStep.findOne({ where: { idWorkflowStep } }).WorkflowStepSystemObjectXref();
    }
};

export default WorkflowStep;
