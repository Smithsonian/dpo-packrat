import { GetSubjectListResult, QueryGetSubjectListArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { Authorization } from '../../../../../auth/Authorization';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

export default async function getSubjectList(_: Parent, args: QueryGetSubjectListArgs): Promise<GetSubjectListResult> {
    const { input } = args;
    const subjects: DBAPI.SubjectUnitIdentifier[] | null =
        await DBAPI.SubjectUnitIdentifier.search(input.search, input.idUnit ?? undefined,
            input.pageNumber ?? undefined, input.rowCount ?? undefined, input.sortBy ?? undefined, input.sortOrder ?? undefined);
    if (!subjects) {
        RK.logError(RK.LogSection.eGQL,'get subject list failed','no subjects found from search',{ input },'GraphQL.SystemObject.SubjectList');
        return { subjects: [] };
    }

    // Filter by effective units for non-admins
    const ctx = Authorization.getContext();
    if (ctx && !ctx.isAdmin) {
        const effectiveUnitSet = new Set(ctx.effectiveUnitIds);
        const totalCount = subjects.length;
        const filtered = subjects.filter(s => effectiveUnitSet.has(s.idUnit));
        Authorization.logFilteredResults('getSubjectList', totalCount, filtered.length);
        return { subjects: filtered };
    }

    return { subjects };
}
