import { QuerySearchIngestionSubjectsArgs, SearchIngestionSubjectsResult } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

export default async function getIngestionItemsForSubjects(_: Parent, args: QuerySearchIngestionSubjectsArgs): Promise<SearchIngestionSubjectsResult> {
    const { input } = args;
    const { query } = input;

    console.log(query);
    return { Subject: [] };
}
