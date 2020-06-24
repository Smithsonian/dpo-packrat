/**
 * Type resolver for AssetVersion
 */
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { AssetVersion, Asset, User } from '../../../../../types/graphql';
import { fetchAssetVersion, fetchAssetForAssetVersionID, fetchUserForAssetVersionID } from '../../../../../db';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { parseAsset } from './Asset';
import { parseUser } from '../../../user/resolvers/types/User';

const AssetVersion = {
    asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveAssetByAssetVersionID(prisma, Number.parseInt(id));
    },
    userCreator: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveUserByAssetVersionID(prisma, Number.parseInt(id));
    }
};

export async function resolveAssetVersionByID(prisma: PrismaClient, assetVersionId: number): Promise<AssetVersion | null> {
    const foundAssetVersion = await fetchAssetVersion(prisma, assetVersionId);

    return parseAssetVersion(foundAssetVersion);
}

export async function resolveAssetByAssetVersionID(prisma: PrismaClient, assetVersionId: number): Promise<Asset | null> {
    const foundAsset = await fetchAssetForAssetVersionID(prisma, assetVersionId);

    return parseAsset(foundAsset);
}

export async function resolveUserByAssetVersionID(prisma: PrismaClient, assetVersionId: number): Promise<User | null> {
    const foundUser = await fetchUserForAssetVersionID(prisma, assetVersionId);

    return parseUser(foundUser);
}

export function parseAssetVersion(foundAssetVersion: DB.AssetVersion | null): AssetVersion | null {
    let assetVersion;
    if (foundAssetVersion) {
        const { idAsset, DateCreated, StorageChecksum, StorageLocation, StorageSize } = foundAssetVersion;
        return {
            id: String(idAsset),
            dateCreated: DateCreated,
            storageLocation: StorageLocation,
            storageChecksum: StorageChecksum,
            storageSize: StorageSize
        };
    }

    return assetVersion;
}

export default AssetVersion;
