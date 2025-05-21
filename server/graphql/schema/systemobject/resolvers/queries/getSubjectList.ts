import { GetSubjectListResult, QueryGetSubjectListArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
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
    return { subjects };
}