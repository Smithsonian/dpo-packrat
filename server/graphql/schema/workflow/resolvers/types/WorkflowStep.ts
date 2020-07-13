/**
 * Type resolver for WorkflowStep
 */
import { User, Vocabulary, Workflow, WorkflowStepSystemObjectXref } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const WorkflowStep = {
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idUserOwner } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUser(prisma, idUserOwner);
    },
    VWorkflowStepType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVWorkflowStepType } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVWorkflowStepType);
    },
    Workflow: async (parent: Parent, _: Args, context: Context): Promise<Workflow | null> => {
        const { idWorkflow } = parent;
        const { prisma } = context;

        return await DBAPI.fetchWorkflow(prisma, idWorkflow);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromWorkflowStepID(parent.idWorkflowStep);
    },
    WorkflowStepSystemObjectXref: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStepSystemObjectXref[] | null> => {
        const { idWorkflowStep } = parent;
        const { prisma } = context;

        return await DBAPI.fetchWorkflowStepSystemObjectXrefFromWorkflowStep(prisma, idWorkflowStep);
    }
};

export default WorkflowStep;
