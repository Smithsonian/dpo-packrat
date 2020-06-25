/**
 * Type resolver for Project
 */
import { ProjectDocumentation, Project } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Project = {
    ProjectDocumentation: async (parent: Parent, _: Args, context: Context): Promise<ProjectDocumentation[] | null> => {
        const { idProject } = parent;
        const { prisma } = context;

        return prisma.project.findOne({ where: { idProject: Number.parseInt(idProject) } }).ProjectDocumentation();
    }
};

export default Project;
