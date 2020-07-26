/**
 * Type resolver for WorkflowStepSystemObjectXref
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const WorkflowStepSystemObjectXref = {
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetch(parent.idSystemObject);
    },
    WorkflowStep: async (parent: Parent): Promise<DBAPI.WorkflowStep | null> => {
        return await DBAPI.WorkflowStep.fetch(parent.idWorkflowStep);
    }
};

export default WorkflowStepSystemObjectXref;
