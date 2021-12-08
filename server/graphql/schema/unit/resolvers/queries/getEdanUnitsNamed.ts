import { GetEdanUnitsNamedResult } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function GetEdanUnitsNamed(_: Parent): Promise<GetEdanUnitsNamedResult> {
    const UnitEdan: DBAPI.UnitEdan[] | null = await DBAPI.UnitEdan.fetchNamed();
    return { UnitEdan };
}
