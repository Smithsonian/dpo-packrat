import { CreateSceneResult, MutationCreateSceneArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createScene(_: Parent, args: MutationCreateSceneArgs): Promise<CreateSceneResult> {
    const { input } = args;
    const { Subtitle, idAssetThumbnail, CountScene, CountNode, CountCamera,
        CountLight, CountModel, CountMeta, CountSetup, CountTour, EdanUUID,
        ApprovedForPublication, PosedAndQCd } = input;

    const Scene = new DBAPI.Scene({
        idScene: 0,
        Name: Subtitle, // FIXME
        Title: Subtitle,
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
    });
    await Scene.create();

    return { Scene };
}
