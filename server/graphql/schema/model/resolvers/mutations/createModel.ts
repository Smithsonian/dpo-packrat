import { CreateModelResult, MutationCreateModelArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createModel(_: Parent, args: MutationCreateModelArgs): Promise<CreateModelResult> {
    const { input } = args;
    const { Name, Authoritative, idVCreationMethod, idVModality, idVPurpose, idVUnits, Master, idAssetThumbnail } = input;

    const modelArgs = {
        idModel: 0,
        Name,
        Authoritative,
        idVCreationMethod,
        idVModality,
        idVPurpose,
        idVUnits,
        Master,
        idAssetThumbnail: idAssetThumbnail || null,
        DateCreated: new Date()
    };

    const Model = new DBAPI.Model(modelArgs);
    await Model.create();

    return { Model };
}
