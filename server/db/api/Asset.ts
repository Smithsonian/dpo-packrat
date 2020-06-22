/* eslint-disable camelcase */
import { PrismaClient, Asset, SystemObject } from '@prisma/client';
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

export async function fetchAsset(prisma: PrismaClient, idAsset: number): Promise<Asset | null> {
    try {
        return await prisma.asset.findOne({ where: { idAsset, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAsset', error);
        return null;
    }
}

export async function fetchSystemObjectForAsset(prisma: PrismaClient, sysObj: Asset): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idAsset: sysObj.idAsset, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForAsset', error);
        return null;
    }
}

export async function fetchSystemObjectForAssetID(prisma: PrismaClient, idAsset: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idAsset, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForAssetID', error);
        return null;
    }
}

export async function fetchSystemObjectAndAssetID(prisma: PrismaClient, idAsset: number): Promise<SystemObject & { Asset: Asset | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idAsset, }, include: { Asset: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndAssetID', error);
        return null;
    }
}

