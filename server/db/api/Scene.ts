/* eslint-disable camelcase */
import { PrismaClient, Scene, SystemObject } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createScene(prisma: PrismaClient, scene: Scene): Promise<Scene | null> {
    let createSystemObject: Scene;
    const { Name, idAssetThumbnail, IsOriented, HasBeenQCd } = scene;
    try {
        createSystemObject = await prisma.scene.create({
            data: {
                Name,
                Asset:              idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                IsOriented,
                HasBeenQCd,
                SystemObject:       { create: { Retired: false }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createScene', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchScene(prisma: PrismaClient, idScene: number): Promise<Scene | null> {
    try {
        return await prisma.scene.findOne({ where: { idScene, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchScene', error);
        return null;
    }
}

export async function fetchSystemObjectForScene(prisma: PrismaClient, sysObj: Scene): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idScene: sysObj.idScene, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForScene', error);
        return null;
    }
}

export async function fetchSystemObjectForSceneID(prisma: PrismaClient, idScene: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idScene, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForSceneID', error);
        return null;
    }
}

export async function fetchSystemObjectAndScene(prisma: PrismaClient, idScene: number): Promise<SystemObject & { Scene: Scene | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idScene, }, include: { Scene: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndScene', error);
        return null;
    }
}

