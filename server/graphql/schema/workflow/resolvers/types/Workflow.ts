/**
 * Type resolver for Workflow
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Workflow = {
    Project: async (parent: Parent): Promise<DBAPI.Project | null> => {
        return await DBAPI.Project.fetch(parent.idProject);
    },
    UserInitiator: async (parent: Parent): Promise<DBAPI.User | null> => {
        return await DBAPI.User.fetch(parent.idUserInitiator);
    },
    WorkflowTemplate: async (parent: Parent): Promise<DBAPI.WorkflowTemplate | null> => {
        return await DBAPI.WorkflowTemplate.fetch(parent.idWorkflowTemplate);
    },
    WorkflowStep: async (parent: Parent): Promise<DBAPI.WorkflowStep[] | null> => {
        return await DBAPI.WorkflowStep.fetchFromWorkflow(parent.idWorkflow);
    }
};

export default Workflow;
