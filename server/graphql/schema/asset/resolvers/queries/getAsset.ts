import { GetAssetResult, GetAssetInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';

import { resolveAssetByID } from '../types/Asset';

type Args = { input: GetAssetInput };

export default async function getAsset(_: Parent, args: Args, context: Context): Promise<GetAssetResult> {
    const { input } = args;
    const { idAsset } = input;
    const { prisma } = context;

    const Asset = await resolveAssetByID(prisma, Number.parseInt(idAsset));

    if (Asset) {
        return { Asset };
    }

    return { Asset: null };
}
