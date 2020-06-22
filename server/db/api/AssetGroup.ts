/* eslint-disable camelcase */
import { PrismaClient, AssetGroup } from '@prisma/client';
import * as LOG from '../../utils/logger';

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

export async function fetchAssetGroup(prisma: PrismaClient, idAssetGroup: number): Promise<AssetGroup | null> {
    try {
        return await prisma.assetGroup.findOne({ where: { idAssetGroup, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAssetGroup', error);
        return null;
    }
}
