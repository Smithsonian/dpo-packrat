import { GetAssetResult, GetAssetInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';

import { resolveAssetByID } from '../types/Asset';

type Args = { input: GetAssetInput };

export default async function getAsset(_: Parent, args: Args, context: Context): Promise<GetAssetResult> {
    const { input } = args;
    const { id } = input;
    const { prisma } = context;

    const asset = await resolveAssetByID(prisma, Number.parseInt(id));

    if (asset) {
        return { asset };
    }

    return { asset: null };
}
