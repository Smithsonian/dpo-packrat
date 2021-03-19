import { GetUnitsFromNameSearchResult, QueryGetUnitsFromNameSearchArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getUnitsFromNameSearch(_: Parent, args: QueryGetUnitsFromNameSearchArgs): Promise<GetUnitsFromNameSearchResult> {
    const { input } = args;
    const { search } = input;
    const Units = await DBAPI.Unit.fetchFromNameSearch(search);
    if (!Units) {
        return {
            Units: []
        };
    }
    return { Units };
}
