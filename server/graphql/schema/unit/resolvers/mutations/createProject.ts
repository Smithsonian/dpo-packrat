import { CreateProjectResult, MutationCreateProjectArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function CreateProject(_: Parent, args: MutationCreateProjectArgs): Promise<CreateProjectResult> {
    const { input } = args;
    const { Name, Unit, Description } = input;

    const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(Unit);
    if (!unit)
        throw new Error(`Project creation failed: Unable to fetch unit ${Unit}`);

    const projectArgs = {
        idProject: 0,
        Name,
        Description
    };

    const Project: DBAPI.Project = new DBAPI.Project(projectArgs);
    if (!await Project.create())
        throw new Error('Project creation failed');

    const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(unit, Project);
    if (!xref)
        throw new Error('Project creation failed to wire new project to unit');

    return { Project };
}
