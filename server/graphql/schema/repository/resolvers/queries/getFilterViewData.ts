import * as DBAPI from '../../../../../db';
import { GetFilterViewDataResult } from '../../../../../types/graphql';
import { Authorization } from '../../../../../auth/Authorization';

export default async function getFilterViewData(): Promise<GetFilterViewDataResult> {

    let units: DBAPI.Unit[] = [];
    let projects: DBAPI.Project[] = [];

    const Unit: DBAPI.Unit[] | null = await DBAPI.Unit.fetchAll();

    if (Unit && Unit.length) {
        units.push(...Unit);
    }

    const Project: DBAPI.Project[] | null = await DBAPI.Project.fetchAll();

    if (Project && Project.length) {
        projects.push(...Project);
    }

    // Filter by authorization context
    const ctx = Authorization.getContext();
    if (ctx && !ctx.isAdmin) {
        const unitSet = new Set(ctx.authorizedUnitIds);
        units = units.filter(u => unitSet.has(u.idUnit));
        projects = Authorization.filterProjects(projects, ctx);
    }

    return { units, projects };
}
