/**
 * Type resolver for Asset
 */
import {
    Asset,
    AssetGroup,
    CaptureDataFile,
    Scene,
    IntermediaryFile,
    AssetVersion,
    CaptureData,
    Item,
    Metadata,
    Model,
    ModelGeometryFile,
    ModelUVMapFile,
    Subject,
    SystemObject
} from '@prisma/client';
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
    CaptureData: async (parent: Parent, _: Args, context: Context): Promise<CaptureData[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset } }).CaptureData();
    },
    CaptureDataFile: async (parent: Parent, _: Args, context: Context): Promise<CaptureDataFile[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset } }).CaptureDataFile();
    },
    IntermediaryFile: async (parent: Parent, _: Args, context: Context): Promise<IntermediaryFile[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset } }).IntermediaryFile();
    },
    Item: async (parent: Parent, _: Args, context: Context): Promise<Item[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset } }).Item();
    },
    Metadata: async (parent: Parent, _: Args, context: Context): Promise<Metadata[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset } }).Metadata();
    },
    Model: async (parent: Parent, _: Args, context: Context): Promise<Model[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset } }).Model();
    },
    ModelGeometryFile: async (parent: Parent, _: Args, context: Context): Promise<ModelGeometryFile[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset } }).ModelGeometryFile();
    },
    ModelUVMapFile: async (parent: Parent, _: Args, context: Context): Promise<ModelUVMapFile[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset } }).ModelUVMapFile();
    },
    Scene: async (parent: Parent, _: Args, context: Context): Promise<Scene[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset } }).Scene();
    },
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset } }).Subject();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return prisma.asset.findOne({ where: { idAsset } }).SystemObject();
    }
};

export default Asset;
