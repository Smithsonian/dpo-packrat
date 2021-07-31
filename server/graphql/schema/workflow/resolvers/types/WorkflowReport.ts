/**
 * Type resolver for WorkflowReport
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const WorkflowReport = {
    Workflow: async (parent: Parent): Promise<DBAPI.Workflow | null> => {
        return await DBAPI.Workflow.fetch(parent.idWorkflow);
    }
};

export default WorkflowReport;