import { GetUnitsFromNameSearchResult, QueryGetUnitsFromNameSearchArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { Authorization } from '../../../../../auth/Authorization';

export default async function getUnitsFromNameSearch(_: Parent, args: QueryGetUnitsFromNameSearchArgs): Promise<GetUnitsFromNameSearchResult> {
    const { input } = args;
    const { search } = input;
    let Units = await DBAPI.Unit.fetchFromNameSearch(search);
    if (!Units) {
        return {
            Units: []
        };
    }

    // Filter by effective units for non-admins
    const ctx = Authorization.getContext();
    if (ctx && !ctx.isAdmin) {
        const effectiveUnitSet = new Set(ctx.effectiveUnitIds);
        const totalCount = Units.length;
        Units = Units.filter(u => effectiveUnitSet.has(u.idUnit));
        Authorization.logFilteredResults('getUnitsFromNameSearch', totalCount, Units.length);
    }

    return { Units };
}
