/**
 * Type resolver for WorkflowTemplate
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const WorkflowTemplate = {
    Workflow: async (parent: Parent): Promise<DBAPI.Workflow[] | null> => {
        return await DBAPI.Workflow.fetchFromWorkflowTemplate(parent.idWorkflowTemplate);
    }
};

export default WorkflowTemplate;
