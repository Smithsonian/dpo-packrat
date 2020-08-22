import * as DBAPI from '../../../db';
import { Project as ProjectBase } from '@prisma/client';

export async function createProjectTest(base: ProjectBase): Promise<DBAPI.Project> {
    const project: DBAPI.Project = new DBAPI.Project(base);
    const created: boolean = await project.create();
    expect(created).toBeTruthy();
    expect(project.idProject).toBeGreaterThan(0);
    return project;
}