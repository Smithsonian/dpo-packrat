/**
 * Type resolver for ProjectDocumentation
 */
import { Project } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ProjectDocumentation = {
    Project: async (parent: Parent, _: Args, context: Context): Promise<Project | null> => {
        const { idProject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchProject(prisma, idProject);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromProjectDocumentationID(parent.idProjectDocumentation);
    }
};

export default ProjectDocumentation;
