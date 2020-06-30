import { GetItemResult, QueryGetItemArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';


export default async function getItem(_: Parent, args: QueryGetItemArgs, context: Context): Promise<GetItemResult> {
    const { input } = args;
    const { idItem } = input;
    const { prisma } = context;

    const Item = await DBAPI.fetchItem(prisma, idItem);

    return { Item };
}
