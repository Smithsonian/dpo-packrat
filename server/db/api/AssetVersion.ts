/* eslint-disable camelcase */
import { PrismaClient, AssetVersion, SystemObject } from '@prisma/client';
import * as LOG from '../../utils/logger';

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
                SystemObject:       { create: { Retired: false }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createAssetVersion', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchAssetVersion(prisma: PrismaClient, idAssetVersion: number): Promise<AssetVersion | null> {
    try {
        return await prisma.assetVersion.findOne({ where: { idAssetVersion, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAssetVersion', error);
        return null;
    }
}

export async function fetchSystemObjectForAssetVersion(prisma: PrismaClient, sysObj: AssetVersion): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idAssetVersion: sysObj.idAssetVersion, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForAssetVersion', error);
        return null;
    }
}

export async function fetchSystemObjectForAssetVersionID(prisma: PrismaClient, idAssetVersion: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idAssetVersion, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForAssetVersionID', error);
        return null;
    }
}

export async function fetchSystemObjectAndAssetVersion(prisma: PrismaClient, idAssetVersion: number): Promise<SystemObject & { AssetVersion: AssetVersion | null } | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idAssetVersion, }, include: { AssetVersion: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndAssetVersion', error);
        return null;
    }
}

export async function fetchAssetVersionFromAsset(prisma: PrismaClient, idAsset: number): Promise<AssetVersion[] | null> {
    try {
        return await prisma.assetVersion.findMany({ where: { idAsset } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAssetVersionFromAsset', error);
        return null;
    }
}
