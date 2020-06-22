/* eslint-disable camelcase */
import { PrismaClient, Item, SystemObject } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createItem(prisma: PrismaClient, item: Item): Promise<Item | null> {
    let createSystemObject: Item;
    const { idSubject, idAssetThumbnail, idGeoLocation, Name, EntireSubject } = item;
    try {
        createSystemObject = await prisma.item.create({
            data: {
                Subject:        { connect: { idSubject }, },
                Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : undefined,
                Name,
                EntireSubject,
                SystemObject:   { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createItem', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchItem(prisma: PrismaClient, idItem: number): Promise<Item | null> {
    try {
        return await prisma.item.findOne({ where: { idItem, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchItem', error);
        return null;
    }
}

export async function fetchSystemObjectForItem(prisma: PrismaClient, sysObj: Item): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idItem: sysObj.idItem, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForItem', error);
        return null;
    }
}

export async function fetchSystemObjectForItemID(prisma: PrismaClient, idItem: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idItem, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForItemID', error);
        return null;
    }
}

export async function fetchSystemObjectAndItem(prisma: PrismaClient, idItem: number): Promise<SystemObject & { Item: Item | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idItem, }, include: { Item: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndItem', error);
        return null;
    }
}

