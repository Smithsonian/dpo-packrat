import { GetSubjectListResult, QueryGetSubjectListArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
// import * as DBAPI from '../../../../../db';

export default async function getSubjectList(_: Parent, args: QueryGetSubjectListArgs): Promise<GetSubjectListResult> {
    const { input } = args;
    // const {
    //     search,
    //     idUnit,
    //     pageNumber,
    //     rowCount,
    //     sortBy,
    //     sortOrder
    // } = input;

    console.log(input); // avoid lint
    return { subjects: [] };
}