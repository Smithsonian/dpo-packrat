/**
 * Type resolver for ProjectDocumentation
 */
import { fetchProjectDocumentation, fetchProjectForProjectDocumentationID } from '../../../../../db';
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { ProjectDocumentation, Project } from '../../../../../types/graphql';
import { parseProject } from './Project';

const ProjectDocumentation = {
    Project: async (parent: Parent, _: Args, context: Context): Promise<Project | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveProjectByProjectDocumentationID(prisma, Number.parseInt(id));
    }
};

export async function resolveProjectDocumentationByID(prisma: PrismaClient, projectDocumentationId: number): Promise<ProjectDocumentation | null> {
    const foundProjectDocumentation = await fetchProjectDocumentation(prisma, projectDocumentationId);

    return parseProjectDocumentation(foundProjectDocumentation);
}

export async function resolveProjectByProjectDocumentationID(prisma: PrismaClient, projectDocumentationId: number): Promise<Project | null> {
    const foundProject = await fetchProjectForProjectDocumentationID(prisma, projectDocumentationId);

    return parseProject(foundProject);
}

export function parseProjectDocumentations(foundProjectDocumentations: DB.ProjectDocumentation[] | null): ProjectDocumentation[] | null {
    let projectDocumentations;
    if (foundProjectDocumentations) {
        projectDocumentations = foundProjectDocumentations.map(projectDocumentation => parseProjectDocumentation(projectDocumentation));
    }

    return projectDocumentations;
}

export function parseProjectDocumentation(foundProjectDocumentation: DB.ProjectDocumentation | null): ProjectDocumentation | null {
    let projectDocumentation;
    if (foundProjectDocumentation) {
        const { idProjectDocumentation, Name, Description } = foundProjectDocumentation;
        projectDocumentation = {
            idProjectDocumentation: String(idProjectDocumentation),
            Name,
            Description
        };
    }

    return projectDocumentation;
}

export default ProjectDocumentation;
