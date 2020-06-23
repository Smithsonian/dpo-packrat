/**
 * Type resolver for Asset
 */
import { fetchAsset } from '../../../../../db';
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Asset } from '../../../../../types/graphql';

const Asset = {};

export async function resolveAssetByID(prisma: PrismaClient, assetId: number): Promise<Asset | null> {
    const foundAsset = await fetchAsset(prisma, assetId);

    return parseAsset(foundAsset);
}

export function parseAsset(foundAsset: DB.Asset | null): Asset | null {
    let asset;
    if (foundAsset) {
        const { idAsset, FileName, FilePath } = foundAsset;

        return {
            id: String(idAsset),
            fileName: FileName,
            filePath: FilePath
        };
    }

    return asset;
}

export default Asset;
