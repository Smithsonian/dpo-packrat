/**
 * Type resolver for AssetGroup
 */
import { AssetGroup, Asset } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AssetGroup = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset[] | null> => {
        const { idAssetGroup } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAssetFromAssetGroup(prisma, idAssetGroup);
    }
};

export default AssetGroup;
