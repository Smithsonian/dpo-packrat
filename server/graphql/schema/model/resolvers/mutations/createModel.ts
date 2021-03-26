import { CreateModelResult, MutationCreateModelArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createModel(_: Parent, args: MutationCreateModelArgs): Promise<CreateModelResult> {
    const { input } = args;
    const { Name, Authoritative, idVCreationMethod, idVModality, idVPurpose, idVUnits, idVFileType, Master, idAssetThumbnail,
        CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials, CountMeshes, CountVertices, CountEmbeddedTextures,
        CountLinkedTextures, FileEncoding  } = input;

    const modelArgs = {
        idModel: 0,
        Name,
        Authoritative,
        idVCreationMethod,
        idVModality,
        idVPurpose,
        idVUnits,
        idVFileType,
        Master,
        idAssetThumbnail: idAssetThumbnail || null,
        CountAnimations: CountAnimations || null,
        CountCameras: CountCameras || null,
        CountFaces: CountFaces || null,
        CountLights: CountLights || null,
        CountMaterials: CountMaterials || null,
        CountMeshes: CountMeshes || null,
        CountVertices: CountVertices || null,
        CountEmbeddedTextures: CountEmbeddedTextures || null,
        CountLinkedTextures: CountLinkedTextures || null,
        FileEncoding: FileEncoding || null,
        DateCreated: new Date(),
        idModelMetrics: 0
    };

    const Model = new DBAPI.Model(modelArgs);
    await Model.create();

    return { Model };
}
