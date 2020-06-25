/**
 * Type resolver for Asset
 */
import { Asset, AssetGroup, CaptureDataFile, Scene, IntermediaryFile } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Asset = {
    AssetGroup: async (parent: Parent, _: Args, context: Context): Promise<AssetGroup | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset: Number.parseInt(idAsset) } }).AssetGroup();
    },
    CaptureDataFile: async (parent: Parent, _: Args, context: Context): Promise<CaptureDataFile[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset: Number.parseInt(idAsset) } }).CaptureDataFile();
    },
    Scene: async (parent: Parent, _: Args, context: Context): Promise<Scene[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset: Number.parseInt(idAsset) } }).Scene();
    },
    IntermediaryFile: async (parent: Parent, _: Args, context: Context): Promise<IntermediaryFile[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset: Number.parseInt(idAsset) } }).IntermediaryFile();
    }
};

export default Asset;
