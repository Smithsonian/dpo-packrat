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
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idAssetVersion } = parent;
        const { prisma } = context;

        return resolveAssetByAssetVersionID(prisma, Number.parseInt(idAssetVersion));
    },
    UserCreator: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idAssetVersion } = parent;
        const { prisma } = context;

        return resolveUserByAssetVersionID(prisma, Number.parseInt(idAssetVersion));
    }
};

export async function resolveAssetVersionByID(prisma: PrismaClient, idAssetVersion: number): Promise<AssetVersion | null> {
    const foundAssetVersion = await fetchAssetVersion(prisma, idAssetVersion);

    return parseAssetVersion(foundAssetVersion);
}

export async function resolveAssetByAssetVersionID(prisma: PrismaClient, idAssetVersion: number): Promise<Asset | null> {
    const foundAsset = await fetchAssetForAssetVersionID(prisma, idAssetVersion);

    return parseAsset(foundAsset);
}

export async function resolveUserByAssetVersionID(prisma: PrismaClient, idAssetVersion: number): Promise<User | null> {
    const foundUser = await fetchUserForAssetVersionID(prisma, idAssetVersion);

    return parseUser(foundUser);
}

export function parseAssetVersion(foundAssetVersion: DB.AssetVersion | null): AssetVersion | null {
    let assetVersion;
    if (foundAssetVersion) {
        const { idAssetVersion, DateCreated, StorageChecksum, StorageLocation, StorageSize } = foundAssetVersion;
        return {
            idAssetVersion: String(idAssetVersion),
            DateCreated,
            StorageLocation,
            StorageChecksum,
            StorageSize
        };
    }

    return assetVersion;
}

export default AssetVersion;
