/**
 * Type resolver for ProjectDocumentation
 */
import { Project, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const ProjectDocumentation = {
    Project: async (parent: Parent, _: Args, context: Context): Promise<Project | null> => {
        const { idProjectDocumentation } = parent;
        const { prisma } = context;

        return prisma.projectDocumentation.findOne({ where: { idProjectDocumentation: Number.parseInt(idProjectDocumentation) } }).Project();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idProjectDocumentation } = parent;
        const { prisma } = context;

        return prisma.projectDocumentation.findOne({ where: { idProjectDocumentation: Number.parseInt(idProjectDocumentation) } }).SystemObject();
    }
};

export default ProjectDocumentation;
