/**
 * Type resolver for Project
 */
import { ProjectDocumentation, Workflow } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Project = {
    ProjectDocumentation: async (parent: Parent, _: Args, context: Context): Promise<ProjectDocumentation[] | null> => {
        const { idProject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchProjectDocumentationFromProject(prisma, idProject);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromProjectID(parent.idProject);
    },
    Workflow: async (parent: Parent, _: Args, context: Context): Promise<Workflow[] | null> => {
        const { idProject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchWorkflowFromProject(prisma, idProject);
    }
};

export default Project;
