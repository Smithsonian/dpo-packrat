/* eslint-disable camelcase */
import { PrismaClient, Actor, IntermediaryFile, Scene } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createActor(prisma: PrismaClient, actor: Actor): Promise<Actor | null> {
    let createSystemObject: Actor;
    const { IndividualName, OrganizationName, idUnit } = actor;
    try {
        createSystemObject = await prisma.actor.create({
            data: {
                IndividualName,
                OrganizationName,
                Unit:               idUnit ? { connect: { idUnit }, } : undefined,
                SystemObject:       { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createActor', error);
        return null;
    }

    return createSystemObject;
}

export async function createIntermediaryFile(prisma: PrismaClient, intermediaryFile: IntermediaryFile): Promise<IntermediaryFile | null> {
    let createSystemObject: IntermediaryFile;
    const { idAsset, DateCreated } = intermediaryFile;
    try {
        createSystemObject = await prisma.intermediaryFile.create({
            data: {
                Asset:          { connect: { idAsset }, },
                DateCreated,
                SystemObject:   { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createIntermediaryFile', error);
        return null;
    }
    return createSystemObject;
}

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
                SystemObject:       { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createScene', error);
        return null;
    }
    return createSystemObject;
}
