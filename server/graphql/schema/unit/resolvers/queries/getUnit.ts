import { GetUnitResult, QueryGetUnitArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getUnit(_: Parent, args: QueryGetUnitArgs): Promise<GetUnitResult> {
    const { input } = args;
    const { idUnit } = input;

    const Unit = await DBAPI.Unit.fetch(idUnit);
    return { Unit };
}
