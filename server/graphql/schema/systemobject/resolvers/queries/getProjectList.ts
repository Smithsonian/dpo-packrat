import { GetProjectListResult, QueryGetProjectListArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function getProjectList(_: Parent, args: QueryGetProjectListArgs): Promise<GetProjectListResult> {
    const { input } = args;
    const { search } = input;
    const projects: DBAPI.Project[] | null = await DBAPI.Project.fetchProjectList(search);
    if (!projects) {
        LOG.error(`getProjectList failed to retrieve projects for ${search}`, LOG.LS.eGQL);
        return { projects: [] };
    }
    return { projects };
}
