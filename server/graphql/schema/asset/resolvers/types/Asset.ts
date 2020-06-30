/**
 * Type resolver for Asset
 */
import { Asset, AssetGroup, AssetVersion, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Asset = {
    AssetGroup: async (parent: Parent, _: Args, context: Context): Promise<AssetGroup | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset } }).AssetGroup();
    },
    AssetVersion: async (parent: Parent, _: Args, context: Context): Promise<AssetVersion[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset } }).AssetVersion();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset } }).SystemObject();
    }
};

export default Asset;
