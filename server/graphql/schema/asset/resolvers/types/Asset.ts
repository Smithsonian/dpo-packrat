/**
 * Type resolver for Asset
 */
import { Asset, AssetGroup, AssetVersion } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Asset = {
    AssetGroup: async (parent: Parent, _: Args, context: Context): Promise<AssetGroup | null> => {
        const { idAssetGroup } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAssetGroup(prisma, idAssetGroup);
    },
    AssetVersion: async (parent: Parent, _: Args, context: Context): Promise<AssetVersion[] | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAssetVersionFromAsset(prisma, idAsset);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromAssetID(parent.idAsset);
    }
};

export default Asset;
