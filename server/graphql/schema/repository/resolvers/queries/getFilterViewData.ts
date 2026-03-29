import * as DBAPI from '../../../../../db';
import { GetFilterViewDataResult } from '../../../../../types/graphql';
import { Authorization } from '../../../../../auth/Authorization';
import { ASL } from '../../../../../utils/localStore';

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
    let ctx = Authorization.getContext();

    // Fallback: build context on the fly if missing but user is known
    if (!ctx) {
        const LS = ASL.getStore();
        if (LS?.idUser) {
            ctx = await Authorization.buildContext(LS.idUser);
            LS.authContext = ctx;
        }
    }

    if (ctx && !ctx.isAdmin) {
        const totalUnits = units.length;
        const totalProjects = projects.length;
        const unitSet = new Set(ctx.effectiveUnitIds);
        units = units.filter(u => unitSet.has(u.idUnit));
        projects = Authorization.filterProjects(projects, ctx);
        Authorization.logFilteredResults('getFilterViewData.units', totalUnits, units.length);
        Authorization.logFilteredResults('getFilterViewData.projects', totalProjects, projects.length);
    }

    return { units, projects };
}
