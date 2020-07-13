/**
 * Type resolver for AssetVersion
 */
import { AssetVersion, Asset, User } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AssetVersion = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAsset(prisma, idAsset);
    },
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idUserCreator } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUser(prisma, idUserCreator);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromAssetVersionID(parent.idAssetVersion);
    }
};

export default AssetVersion;
