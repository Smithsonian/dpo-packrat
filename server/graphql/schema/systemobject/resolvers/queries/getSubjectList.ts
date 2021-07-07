import { GetSubjectListResult, QueryGetSubjectListArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function getSubjectList(_: Parent, args: QueryGetSubjectListArgs): Promise<GetSubjectListResult> {
    const { input } = args;
    const subjects: DBAPI.SubjectUnitIdentifier[] | null =
        await DBAPI.SubjectUnitIdentifier.search(input.search, input.idUnit ?? undefined,
            input.pageNumber ?? undefined, input.rowCount ?? undefined, input.sortBy ?? undefined, input.sortOrder ?? undefined);
    if (!subjects) {
        LOG.error(`getSubjectList(${JSON.stringify(input)}) failed`, LOG.LS.eGQL);
        return { subjects: [] };
    }
    return { subjects };
}