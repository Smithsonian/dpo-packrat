/**
 * Type resolver for WorkflowTemplate
 */
import { Workflow } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const WorkflowTemplate = {
    Workflow: async (parent: Parent, _: Args, context: Context): Promise<Workflow[] | null> => {
        const { idWorkflowTemplate } = parent;
        const { prisma } = context;

        return await DBAPI.fetchWorkflowFromWorkflowTemplate(prisma, idWorkflowTemplate);
    }
};

export default WorkflowTemplate;
