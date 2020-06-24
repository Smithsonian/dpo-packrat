/**
 * Type resolver for Project
 */
import { fetchProject, fetchProjectDocumentationForProjectID } from '../../../../../db';
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { ProjectDocumentation, Project } from '../../../../../types/graphql';
import { parseProjectDocumentations } from './ProjectDocumentation';

const Project = {
    ProjectDocumentation: async (parent: Parent, _: Args, context: Context): Promise<ProjectDocumentation[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveProjectDocumentationByProjectID(prisma, Number.parseInt(id));
    }
};

export async function resolveProjectByID(prisma: PrismaClient, projectId: number): Promise<Project | null> {
    const foundProject = await fetchProject(prisma, projectId);

    return parseProject(foundProject);
}

export function parseProject(foundProject: DB.Project | null): Project | null {
    let project;
    if (foundProject) {
        const { idProject, Name, Description } = foundProject;
        project = {
            idProject: String(idProject),
            Name,
            Description
        };
    }

    return project;
}

export async function resolveProjectDocumentationByProjectID(prisma: PrismaClient, projectId: number): Promise<ProjectDocumentation[] | null> {
    const foundProjectDocumentations = await fetchProjectDocumentationForProjectID(prisma, projectId);

    return parseProjectDocumentations(foundProjectDocumentations);
}

export default Project;
