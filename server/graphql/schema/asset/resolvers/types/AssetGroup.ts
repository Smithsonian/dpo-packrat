/**
 * Type resolver for AssetGroup
 */
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { AssetGroup, Asset } from '../../../../../types/graphql';
import { fetchAssetGroup, fetchAssetForAssetGroupID } from '../../../../../db';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { parseAssets } from './Asset';

const AssetGroup = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset[] | null> => {
        const { idAssetGroup } = parent;
        const { prisma } = context;

        return resolveAssetByAssetGroupID(prisma, Number.parseInt(idAssetGroup));
    }
};

export async function resolveAssetGroupByID(prisma: PrismaClient, idAssetGroup: number): Promise<AssetGroup | null> {
    const foundAssetGroup = await fetchAssetGroup(prisma, idAssetGroup);

    return parseAssetGroup(foundAssetGroup);
}

export async function resolveAssetByAssetGroupID(prisma: PrismaClient, idAssetGroup: number): Promise<Asset[] | null> {
    const foundAssets = await fetchAssetForAssetGroupID(prisma, idAssetGroup);

    return parseAssets(foundAssets);
}

export function parseAssetGroup(foundAssetGroup: DB.AssetGroup | null): AssetGroup | null {
    let assetGroup;
    if (foundAssetGroup) {
        const { idAssetGroup } = foundAssetGroup;
        return {
            idAssetGroup: String(idAssetGroup)
        };
    }

    return assetGroup;
}

export default AssetGroup;
