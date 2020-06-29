/**
 * Type resolver for AssetVersion
 */
import { AssetVersion, Asset, User, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const AssetVersion = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idAssetVersion } = parent;
        const { prisma } = context;

        return prisma.assetVersion.findOne({ where: { idAssetVersion } }).Asset();
    },
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idAssetVersion } = parent;
        const { prisma } = context;

        return prisma.assetVersion.findOne({ where: { idAssetVersion } }).User();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idAssetVersion } = parent;
        const { prisma } = context;

        return prisma.assetVersion.findOne({ where: { idAssetVersion } }).SystemObject();
    }
};

export default AssetVersion;
