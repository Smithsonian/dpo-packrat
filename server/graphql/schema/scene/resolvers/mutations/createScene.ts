import { CreateSceneResult, MutationCreateSceneArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createScene(_: Parent, args: MutationCreateSceneArgs, context: Context): Promise<CreateSceneResult> {
    const { input } = args;
    const { Name, HasBeenQCd, IsOriented, idAssetThumbnail } = input;
    const { prisma } = context;

    const sceneArgs = {
        idScene: 0,
        Name,
        idAssetThumbnail: idAssetThumbnail || null,
        HasBeenQCd,
        IsOriented
    };

    const Scene = await DBAPI.createScene(prisma, sceneArgs);

    return { Scene };
}
