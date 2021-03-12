import { GetUnitsFromNameSearchResult, QueryGetUnitsFromNameSearchArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getUnitsFromNameSearch(_: Parent, args: QueryGetUnitsFromNameSearchArgs): Promise<GetUnitsFromNameSearchResult> {
    const { input } = args;
    const { search } = input;
    console.log('input', input);
    console.log('search', input.search);
    const Units = await DBAPI.Unit.fetchFromNameSearch(search);
    console.log(Units);
    if (!Units) {
        return {
            Units: []
        }
    }
    return { Units };
}
