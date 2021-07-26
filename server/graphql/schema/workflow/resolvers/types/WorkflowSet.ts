/**
 * Type resolver for WorkflowSet
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const WorkflowSet = {
    Workflow: async (parent: Parent): Promise<DBAPI.Workflow[] | null> => {
        return await DBAPI.Workflow.fetchFromWorkflowSet(parent.idWorkflow);
    }
};

export default WorkflowSet;