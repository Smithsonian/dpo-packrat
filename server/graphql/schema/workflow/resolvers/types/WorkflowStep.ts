/**
 * Type resolver for WorkflowStep
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const WorkflowStep = {
    JobRun: async (parent: Parent): Promise<DBAPI.JobRun | null> => {
        return await DBAPI.JobRun.fetch(parent.idJobRun);
    },
    User: async (parent: Parent): Promise<DBAPI.User | null> => {
        return await DBAPI.User.fetch(parent.idUserOwner);
    },
    VWorkflowStepType: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVWorkflowStepType);
    },
    Workflow: async (parent: Parent): Promise<DBAPI.Workflow | null> => {
        return await DBAPI.Workflow.fetch(parent.idWorkflow);
    },
    WorkflowStepSystemObjectXref: async (parent: Parent): Promise<DBAPI.WorkflowStepSystemObjectXref[] | null> => {
        return await DBAPI.WorkflowStepSystemObjectXref.fetchFromWorkflowStep(parent.idWorkflowStep);
    }
};

export default WorkflowStep;
