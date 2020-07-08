/**
 * Type resolver for Workflow
 */
import { Project, User, WorkflowTemplate, SystemObject, WorkflowStep } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Workflow = {
    Project: async (parent: Parent, _: Args, context: Context): Promise<Project | null> => {
        const { idProject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchProject(prisma, idProject);
    },
    UserInitiator: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idUserInitiator } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUser(prisma, idUserInitiator);
    },
    WorkflowTemplate: async (parent: Parent, _: Args, context: Context): Promise<WorkflowTemplate | null> => {
        const { idWorkflowTemplate } = parent;
        const { prisma } = context;

        return await DBAPI.fetchWorkflowTemplate(prisma, idWorkflowTemplate);
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idWorkflow } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObjectFromWorkflow(prisma, idWorkflow);
    },
    WorkflowStep: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStep[] | null> => {
        const { idWorkflow } = parent;
        const { prisma } = context;

        return await DBAPI.fetchWorkflowStepFromWorkflow(prisma, idWorkflow);
    }
};

export default Workflow;
