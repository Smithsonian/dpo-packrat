import { GetSubjectsForUnitResult, QueryGetSubjectsForUnitArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { Authorization } from '../../../../../auth/Authorization';

export default async function getSubjectsForUnit(_: Parent, args: QueryGetSubjectsForUnitArgs): Promise<GetSubjectsForUnitResult> {
    const { input } = args;
    const { idUnit } = input;

    // Verify user has access to this unit (authorized units + units of assigned restricted projects)
    const ctx = Authorization.getContext();
    if (ctx && !ctx.isAdmin) {
        if (!ctx.effectiveUnitIds.includes(idUnit)) {
            Authorization.logUnitDenial(ctx.idUser, idUnit, 'getSubjectsForUnit');
            return { Subject: [] };
        }
    }

    const Subject = await DBAPI.Subject.fetchFromUnit(idUnit);

    if (Subject) {
        return { Subject };
    }

    return { Subject: [] };
}
