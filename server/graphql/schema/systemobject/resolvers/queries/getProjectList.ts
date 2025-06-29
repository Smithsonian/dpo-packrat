import { GetProjectListResult, QueryGetProjectListArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

export default async function getProjectList(_: Parent, args: QueryGetProjectListArgs): Promise<GetProjectListResult> {
    const { input } = args;
    const { search } = input;
    const projects: DBAPI.Project[] | null = await DBAPI.Project.fetchProjectList(search);
    if (!projects) {
        RK.logError(RK.LogSection.eGQL,'get project list failed','failed to retrieve projects',{ search },'GraphQL.SystemObject.ProjectList');
        return { projects: [] };
    }
    return { projects };
}
