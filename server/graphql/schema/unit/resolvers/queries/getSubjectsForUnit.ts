import { GetSubjectsForUnitResult, QueryGetSubjectsForUnitArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getSubjectsForUnit(_: Parent, args: QueryGetSubjectsForUnitArgs): Promise<GetSubjectsForUnitResult> {
    const { input } = args;
    const { idUnit } = input;

    const Subject = await DBAPI.Subject.fetchFromUnit(idUnit);

    if (Subject) {
        return { Subject };
    }

    return { Subject: [] };
}
