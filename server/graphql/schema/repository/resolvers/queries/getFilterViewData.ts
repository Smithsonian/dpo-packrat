import * as DBAPI from '../../../../../db';
import { GetFilterViewDataResult } from '../../../../../types/graphql';

export default async function getFilterViewData(): Promise<GetFilterViewDataResult> {

    const units: DBAPI.Unit[] = [];
    const projects: DBAPI.Project[] = [];

    const Unit: DBAPI.Unit[] | null = await DBAPI.Unit.fetchAll();

    if (Unit && Unit.length) {
        units.push(...Unit);
    }

    const Project: DBAPI.Project[] | null = await DBAPI.Project.fetchAll();

    if (Project && Project.length) {
        projects.push(...Project);
    }

    return { units, projects };
}
