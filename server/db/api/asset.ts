/* eslint-disable camelcase */
import { PrismaClient, Asset, AssetGroup, AssetVersion } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createAsset(prisma: PrismaClient, asset: Asset): Promise<Asset | null> {
    let createSystemObject: Asset;
    const { FileName, FilePath, idAssetGroup } = asset;
    try {
        createSystemObject = await prisma.asset.create({
            data: {
                FileName,
                FilePath,
                AssetGroup:     idAssetGroup ? { connect: { idAssetGroup }, } : undefined,
                SystemObject:   { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createAsset', error);
        return null;
    }
    return createSystemObject;
}

export async function createAssetGroup(prisma: PrismaClient, assetGroup: AssetGroup): Promise<AssetGroup | null> {
    let createSystemObject: AssetGroup;
    assetGroup;
    try {
        createSystemObject = await prisma.assetGroup.create({
            data: {
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createAssetGroup', error);
        return null;
    }

    return createSystemObject;
}

export async function createAssetVersion(prisma: PrismaClient, assetVersion: AssetVersion): Promise<AssetVersion | null> {
    let createSystemObject: AssetVersion;
    const { idAsset, idUserCreator, DateCreated, StorageLocation, StorageChecksum, StorageSize } = assetVersion;
    try {
        createSystemObject = await prisma.assetVersion.create({
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
    } catch (error) {
        LOG.logger.error('DBAPI.createAssetVersion', error);
        return null;
    }
    return createSystemObject;
}
