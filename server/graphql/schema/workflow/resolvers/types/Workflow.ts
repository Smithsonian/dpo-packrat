/**
 * Type resolver for Workflow
 */
import { Project, User, WorkflowTemplate } from '@prisma/client';
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
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromWorkflowID(parent.idWorkflow);
    },
    WorkflowStep: async (parent: Parent): Promise<DBAPI.WorkflowStep[] | null> => {
        return await DBAPI.WorkflowStep.fetchFromWorkflow(parent.idWorkflow);
    }
};

export default Workflow;
