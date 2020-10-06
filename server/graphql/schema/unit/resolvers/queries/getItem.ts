import { GetItemResult, QueryGetItemArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getItem(_: Parent, args: QueryGetItemArgs): Promise<GetItemResult> {
    const { input } = args;
    const { idItem } = input;

    const Item = await DBAPI.Item.fetch(idItem);
    return { Item };
}
