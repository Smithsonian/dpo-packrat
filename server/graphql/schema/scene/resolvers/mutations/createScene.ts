import { CreateSceneResult, MutationCreateSceneArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createScene(_: Parent, args: MutationCreateSceneArgs): Promise<CreateSceneResult> {
    const { input } = args;
    const { Name, HasBeenQCd, IsOriented, idAssetThumbnail } = input;

    const sceneArgs = {
        idScene: 0,
        Name,
        idAssetThumbnail: idAssetThumbnail || null,
        HasBeenQCd,
        IsOriented
    };

    const Scene = new DBAPI.Scene(sceneArgs);
    await Scene.create();

    return { Scene };
}
