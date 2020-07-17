import { GetProjectResult, QueryGetProjectArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getProject(_: Parent, args: QueryGetProjectArgs): Promise<GetProjectResult> {
    const { input } = args;
    const { idProject } = input;
    const Project = await DBAPI.Project.fetch(idProject);
    return { Project };
}
