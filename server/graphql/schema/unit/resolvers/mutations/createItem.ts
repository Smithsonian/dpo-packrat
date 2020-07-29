import { CreateItemResult, MutationCreateItemArgs } from '../../../../../types/graphql';
import { Parent  } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createItem(_: Parent, args: MutationCreateItemArgs): Promise<CreateItemResult> {
    const { input } = args;
    const { idAssetThumbnail, idGeoLocation, Name, EntireSubject } = input;

    const itemArgs = {
        idItem: 0,
        idAssetThumbnail: idAssetThumbnail || null,
        idGeoLocation: idGeoLocation || null,
        Name,
        EntireSubject
    };

    const Item = new DBAPI.Item(itemArgs);
    await Item.create();

    return { Item };
}
