import { GetUnitsFromEdanAbbreviationResult, QueryGetUnitsFromEdanAbbreviationArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getUnitsFromNameSearch(_: Parent, args: QueryGetUnitsFromEdanAbbreviationArgs): Promise<GetUnitsFromEdanAbbreviationResult> {
    const { input } = args;
    const { abbreviation } = input;
    const Units = await DBAPI.Unit.fetchFromUnitEdanAbbreviation(abbreviation);
    if (!Units) {
        return {
            Units: []
        };
    }
    return { Units };
}
