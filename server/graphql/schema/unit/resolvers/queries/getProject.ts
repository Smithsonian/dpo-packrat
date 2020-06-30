import { GetProjectResult, QueryGetProjectArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getProject(_: Parent, args: QueryGetProjectArgs, context: Context): Promise<GetProjectResult> {
    const { input } = args;
    const { idProject } = input;
    const { prisma } = context;

    const Project = await DBAPI.fetchProject(prisma, idProject);

    return { Project };
}
