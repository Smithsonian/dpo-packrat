import { CreateProjectResult, MutationCreateProjectArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function CreateProject(_: Parent, args: MutationCreateProjectArgs): Promise<CreateProjectResult> {
    const { input } = args;
    const { Name, Description } = input;

    const projectArgs = {
        idProject: 0,
        Name,
        Description
    };

    const Project = new DBAPI.Project(projectArgs);
    await Project.create();
    return { Project };
}
