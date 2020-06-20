/* eslint-disable camelcase */
import { PrismaClient, Asset, AssetGroup, AssetVersion } from '@prisma/client';

export async function createAsset(prisma: PrismaClient, asset: Asset): Promise<Asset> {
    const { FileName, FilePath, idAssetGroup } = asset;
    const createSystemObject: Asset = await prisma.asset.create({
        data: {
            FileName,
            FilePath,
            AssetGroup:     idAssetGroup ? { connect: { idAssetGroup }, } : undefined,
            SystemObject:   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createAssetGroup(prisma: PrismaClient, assetGroup: AssetGroup): Promise<AssetGroup> {
    assetGroup;
    const createSystemObject: AssetGroup = await prisma.assetGroup.create({
        data: {
        },
    });

    return createSystemObject;
}

export async function createAssetVersion(prisma: PrismaClient, assetVersion: AssetVersion): Promise<AssetVersion> {
    const { idAsset, idUserCreator, DateCreated, StorageLocation, StorageChecksum, StorageSize } = assetVersion;
    const createSystemObject: AssetVersion = await prisma.assetVersion.create({
        data: {
            Asset:              { connect: { idAsset }, },
            User:               { connect: { idUser: idUserCreator }, },
            DateCreated,
            StorageLocation,
            StorageChecksum,
            StorageSize,
            SystemObject:       { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}
