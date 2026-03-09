import { GetProjectListResult, QueryGetProjectListArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { Authorization } from '../../../../../auth/Authorization';
import { ASL } from '../../../../../utils/localStore';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

export default async function getProjectList(_: Parent, args: QueryGetProjectListArgs): Promise<GetProjectListResult> {
    const { input } = args;
    const { search } = input;
    let projects: DBAPI.Project[] | null = await DBAPI.Project.fetchProjectList(search);
    if (!projects) {
        RK.logError(RK.LogSection.eGQL,'get project list failed','failed to retrieve projects',{ search },'GraphQL.SystemObject.ProjectList');
        return { projects: [] };
    }

    // Filter by authorization context
    let ctx = Authorization.getContext();
    if (!ctx) {
        const LS = ASL.getStore();
        if (LS?.idUser) {
            ctx = await Authorization.buildContext(LS.idUser);
            LS.authContext = ctx;
        }
    }

    if (ctx && !ctx.isAdmin) {
        const totalProjects = projects.length;
        projects = Authorization.filterProjects(projects, ctx);
        Authorization.logFilteredResults('getProjectList', totalProjects, projects.length);
    }

    return { projects };
}
