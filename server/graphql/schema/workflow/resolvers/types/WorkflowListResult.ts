/**
 * Type resolver for WorkflowListResult
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const WorkflowListResult = {
    UserInitiator: async (parent: Parent): Promise<DBAPI.User | null> => {
        return await DBAPI.User.fetch(parent.idUserInitiator);
    },
    Owner: async (parent: Parent): Promise<DBAPI.User | null> => {
        return await DBAPI.User.fetch(parent.idOwner);
    },
    Workflow: async (parent: Parent): Promise<DBAPI.Workflow | null> => {
        return await DBAPI.Workflow.fetch(parent.idWorkflow);
    },
    WorkflowSet: async (parent: Parent): Promise<DBAPI.WorkflowSet | null> => {
        return await DBAPI.WorkflowSet.fetch(parent.idWorkflowSet);
    }
};

export default WorkflowListResult;