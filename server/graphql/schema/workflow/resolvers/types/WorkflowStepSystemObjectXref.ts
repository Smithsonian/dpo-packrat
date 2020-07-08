/**
 * Type resolver for WorkflowStepSystemObjectXref
 */
import { SystemObject, WorkflowStep } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const WorkflowStepSystemObjectXref = {
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObject(prisma, idSystemObject);
    },
    WorkflowStep: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStep | null> => {
        const { idWorkflowStep } = parent;
        const { prisma } = context;

        return await DBAPI.fetchWorkflowStep(prisma, idWorkflowStep);
    }
};

export default WorkflowStepSystemObjectXref;
