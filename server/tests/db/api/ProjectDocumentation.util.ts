import * as DBAPI from '../../../db';
import { ProjectDocumentation as ProjectDocumentationBase } from '@prisma/client';

export async function createProjectDocumentationTest(base: ProjectDocumentationBase): Promise<DBAPI.ProjectDocumentation> {
    const projectDocumentation: DBAPI.ProjectDocumentation = new DBAPI.ProjectDocumentation(base);
    const created: boolean = await projectDocumentation.create();
    expect(created).toBeTruthy();
    expect(projectDocumentation.idProjectDocumentation).toBeGreaterThan(0);
    return projectDocumentation;
}