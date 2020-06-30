import { CreateModelResult, MutationCreateModelArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createModel(_: Parent, args: MutationCreateModelArgs, context: Context): Promise<CreateModelResult> {
    const { input } = args;
    const { Authoritative, idVCreationMethod, idVModality, idVPurpose, idVUnits, Master, idAssetThumbnail } = input;
    const { prisma } = context;

    const modelArgs = {
        idModel: 0,
        Authoritative,
        idVCreationMethod,
        idVModality,
        idVPurpose,
        idVUnits,
        Master,
        idAssetThumbnail: idAssetThumbnail || null,
        DateCreated: new Date()
    };

    const Model = await DBAPI.createModel(prisma, modelArgs);

    return { Model };
}
