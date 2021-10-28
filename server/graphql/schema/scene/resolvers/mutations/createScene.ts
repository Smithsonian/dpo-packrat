import { CreateSceneResult, MutationCreateSceneArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createScene(_: Parent, args: MutationCreateSceneArgs): Promise<CreateSceneResult> {
    const { input } = args;
    const { Name, idAssetThumbnail, CountScene, CountNode, CountCamera,
        CountLight, CountModel, CountMeta, CountSetup, CountTour, EdanUUID,
        ApprovedForPublication, PosedAndQCd } = input;

    const sceneArgs = {
        idScene: 0,
        Name,
        idAssetThumbnail: idAssetThumbnail || null,
        CountScene: CountScene || null,
        CountNode: CountNode || null,
        CountCamera: CountCamera || null,
        CountLight: CountLight || null,
        CountModel: CountModel || null,
        CountMeta: CountMeta || null,
        CountSetup: CountSetup || null,
        CountTour: CountTour || null,
        EdanUUID: EdanUUID || null,
        ApprovedForPublication,
        PosedAndQCd,
    };

    const Scene = new DBAPI.Scene(sceneArgs);
    await Scene.create();

    return { Scene };
}
