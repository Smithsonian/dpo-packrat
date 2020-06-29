/**
 * Type resolver for WorkflowTemplate
 */
import { Workflow } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const WorkflowTemplate = {
    Workflow: async (parent: Parent, _: Args, context: Context): Promise<Workflow[] | null> => {
        const { idWorkflowTemplate } = parent;
        const { prisma } = context;

        return prisma.workflowTemplate.findOne({ where: { idWorkflowTemplate } }).Workflow();
    }
};

export default WorkflowTemplate;
