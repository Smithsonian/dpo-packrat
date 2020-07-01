import { CreateProjectResult, MutationCreateProjectArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function CreateProject(_: Parent, args: MutationCreateProjectArgs, context: Context): Promise<CreateProjectResult> {
    const { input } = args;
    const { Name, Description } = input;
    const { prisma } = context;

    const projectArgs = {
        idProject: 0,
        Name,
        Description
    };

    const Project = await DBAPI.createProject(prisma, projectArgs);

    return { Project };
}
