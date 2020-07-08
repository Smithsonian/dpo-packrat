/**
 * Type resolver for Metadata
 */

import { Asset, SystemObject, User, Vocabulary } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Metadata = {
    AssetValue: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idAssetValue } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAsset(prisma, idAssetValue);
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObject(prisma, idSystemObject);
    },
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUser(prisma, idUser);
    },
    VMetadataSource: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVMetadataSource } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVMetadataSource);
    }
};

export default Metadata;
