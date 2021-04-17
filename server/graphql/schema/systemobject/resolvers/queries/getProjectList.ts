import { GetProjectListResult, QueryGetProjectListArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getProjectList(_: Parent, args: QueryGetProjectListArgs): Promise<GetProjectListResult> {
    const { input } = args;
    const { search } = input;
    const projects = await DBAPI.Project.fetchProjectList(search);
    if (!projects) {
        return {
            projects: []
        };
    }
    return { projects };
}
