/**
 * Type resolver for WorkflowStep
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const WorkflowStep = {
    User: async (parent: Parent): Promise<DBAPI.User | null> => {
        return await DBAPI.User.fetch(parent.idUserOwner);
    },
    VWorkflowStepType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVWorkflowStepType);
    },
    Workflow: async (parent: Parent): Promise<DBAPI.Workflow | null> => {
        return await DBAPI.Workflow.fetch(parent.idWorkflow);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromWorkflowStepID(parent.idWorkflowStep);
    },
    WorkflowStepSystemObjectXref: async (parent: Parent): Promise<DBAPI.WorkflowStepSystemObjectXref[] | null> => {
        return await DBAPI.WorkflowStepSystemObjectXref.fetchFromWorkflowStep(parent.idWorkflowStep);
    }
};

export default WorkflowStep;
