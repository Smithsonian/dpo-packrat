import { CreateItemResult, MutationCreateItemArgs } from '../../../../../types/graphql';
import { Parent  } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createItem(_: Parent, args: MutationCreateItemArgs): Promise<CreateItemResult> {
    const { input } = args;
    const { idAssetThumbnail, idGeoLocation, Subtitle, EntireSubject } = input;

    const Item = new DBAPI.Item({
        idItem: 0,
        idAssetThumbnail: idAssetThumbnail || null,
        idGeoLocation: idGeoLocation || null,
        Name: Subtitle, // FIXME
        Title: Subtitle,
        EntireSubject
    });
    await Item.create();

    return { Item };
}
