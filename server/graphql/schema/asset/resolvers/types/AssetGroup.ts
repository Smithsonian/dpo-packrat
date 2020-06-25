/**
 * Type resolver for AssetGroup
 */
import { AssetGroup, Asset } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const AssetGroup = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset[] | null> => {
        const { idAssetGroup } = parent;
        const { prisma } = context;

        return prisma.assetGroup.findOne({ where: { idAssetGroup: Number.parseInt(idAssetGroup) } }).Asset();
    }
};

export default AssetGroup;
