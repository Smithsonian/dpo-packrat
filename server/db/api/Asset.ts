/* eslint-disable camelcase */
import { PrismaClient, Asset, SystemObject, AssetGroup, CaptureDataFile, Scene, IntermediaryFile } from '@prisma/client';
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
                SystemObject:   { create: { Retired: false }, },
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

export async function fetchAssetGroupForAssetID(prisma: PrismaClient, idAsset: number): Promise<AssetGroup | null> {
    try {
        return await prisma.asset.findOne({ where: { idAsset } }).AssetGroup();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAssetGroupForAssetID', error);
        return null;
    }
}

export async function fetchCaptureDataFileForAssetID(prisma: PrismaClient, idAsset: number): Promise<CaptureDataFile[] | null> {
    try {
        return await prisma.asset.findOne({ where: { idAsset } }).CaptureDataFile();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchCaptureDataFileForAssetID', error);
        return null;
    }
}

export async function fetchSceneForAssetID(prisma: PrismaClient, idAsset: number): Promise<Scene[] | null> {
    try {
        return await prisma.asset.findOne({ where: { idAsset } }).Scene();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSceneForAssetID', error);
        return null;
    }
}

export async function fetchIntermediaryFileForAssetID(prisma: PrismaClient, idAsset: number): Promise<IntermediaryFile[] | null> {
    try {
        return await prisma.asset.findOne({ where: { idAsset } }).IntermediaryFile();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchIntermediaryFileForAssetID', error);
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

export async function fetchSystemObjectAndAsset(prisma: PrismaClient, idAsset: number): Promise<SystemObject & { Asset: Asset | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idAsset, }, include: { Asset: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndAssetID', error);
        return null;
    }
}

