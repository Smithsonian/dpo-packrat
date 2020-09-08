import { GetItemsForSubjectResult, QueryGetItemsForSubjectArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getItemsForSubject(_: Parent, args: QueryGetItemsForSubjectArgs): Promise<GetItemsForSubjectResult> {
    const { input } = args;
    const { idSubject } = input;

    const Item = await DBAPI.Item.fetchDerivedFromSubject(idSubject);

    if (Item) {
        return { Item };
    }

    return { Item: [] };
}
