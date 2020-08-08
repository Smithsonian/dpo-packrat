import { QueryGetIngestionItemsForSubjectsArgs, GetIngestionItemsForSubjectsResult } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

export default async function getIngestionItemsForSubjects(_: Parent, args: QueryGetIngestionItemsForSubjectsArgs): Promise<GetIngestionItemsForSubjectsResult> {
    const { input } = args;
    const { idSubjects } = input;

    console.log(idSubjects);
    return { Item: [] };
}
