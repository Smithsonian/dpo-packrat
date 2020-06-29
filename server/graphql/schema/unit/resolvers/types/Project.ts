/**
 * Type resolver for Project
 */
import { ProjectDocumentation, SystemObject, Workflow } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Project = {
    ProjectDocumentation: async (parent: Parent, _: Args, context: Context): Promise<ProjectDocumentation[] | null> => {
        const { idProject } = parent;
        const { prisma } = context;

        return prisma.project.findOne({ where: { idProject } }).ProjectDocumentation();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idProject } = parent;
        const { prisma } = context;

        return prisma.project.findOne({ where: { idProject } }).SystemObject();
    },
    Workflow: async (parent: Parent, _: Args, context: Context): Promise<Workflow[] | null> => {
        const { idProject } = parent;
        const { prisma } = context;

        return prisma.project.findOne({ where: { idProject } }).Workflow();
    }
};

export default Project;
