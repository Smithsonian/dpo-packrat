import { QueryGetIngestionItemsForSubjectsArgs, GetIngestionItemsForSubjectsResult } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getIngestionItemsForSubjects(_: Parent, args: QueryGetIngestionItemsForSubjectsArgs): Promise<GetIngestionItemsForSubjectsResult> {
    const { input } = args;
    const { idSubjects } = input;

    const Item = await DBAPI.Item.fetchFromSubjects(idSubjects);

    if (Item) {
        return { Item };
    }

    return { Item: [] };
}
