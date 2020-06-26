/**
 * Type resolver for Metadata
 */

import { Asset, SystemObject, User, Vocabulary } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Metadata = {
    AssetValue: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idMetadata } = parent;
        const { prisma } = context;

        return prisma.metadata.findOne({ where: { idMetadata } }).Asset();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idMetadata } = parent;
        const { prisma } = context;

        return prisma.metadata.findOne({ where: { idMetadata } }).SystemObject();
    },
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idMetadata } = parent;
        const { prisma } = context;

        return prisma.metadata.findOne({ where: { idMetadata } }).User();
    },
    VMetadataSource: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idMetadata } = parent;
        const { prisma } = context;

        return prisma.metadata.findOne({ where: { idMetadata } }).Vocabulary();
    }
};

export default Metadata;
