/**
 * Type resolver for ProjectDocumentation
 */
import { Project, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ProjectDocumentation = {
    Project: async (parent: Parent, _: Args, context: Context): Promise<Project | null> => {
        const { idProject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchProject(prisma, idProject);
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idProjectDocumentation } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObjectFromProjectDocumentation(prisma, idProjectDocumentation);
    }
};

export default ProjectDocumentation;
