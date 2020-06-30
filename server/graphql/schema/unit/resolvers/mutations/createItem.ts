import { CreateItemResult, MutationCreateItemArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createItem(_: Parent, args: MutationCreateItemArgs, context: Context): Promise<CreateItemResult> {
    const { input } = args;
    const { idSubject, idAssetThumbnail, idGeoLocation, Name, EntireSubject } = input;
    const { prisma } = context;

    const itemArgs = {
        idItem: 0,
        idSubject,
        idAssetThumbnail: idAssetThumbnail || null,
        idGeoLocation: idGeoLocation || null,
        Name,
        EntireSubject
    };

    const Item = await DBAPI.createItem(prisma, itemArgs);

    return { Item };
}
