/**
 * Type resolver for AssetGroup
 */
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { AssetGroup, Asset } from '../../../../../types/graphql';
import { fetchAssetGroup, fetchAssetsForAssetGroupID } from '../../../../../db';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { parseAssets } from './Asset';

const AssetGroup = {
    assets: async (parent: Parent, _: Args, context: Context): Promise<Asset[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveAssetsByAssetGroupID(prisma, Number.parseInt(id));
    }
};

export async function resolveAssetGroupByID(prisma: PrismaClient, assetGroupId: number): Promise<AssetGroup | null> {
    const foundAssetGroup = await fetchAssetGroup(prisma, assetGroupId);

    return parseAssetGroup(foundAssetGroup);
}

export async function resolveAssetsByAssetGroupID(prisma: PrismaClient, assetGroupId: number): Promise<Asset[] | null> {
    const foundAssets = await fetchAssetsForAssetGroupID(prisma, assetGroupId);

    return parseAssets(foundAssets);
}

export function parseAssetGroup(foundAssetGroup: DB.AssetGroup | null): AssetGroup | null {
    let assetGroup;
    if (foundAssetGroup) {
        const { idAssetGroup } = foundAssetGroup;
        return {
            id: String(idAssetGroup)
        };
    }

    return assetGroup;
}

export default AssetGroup;
