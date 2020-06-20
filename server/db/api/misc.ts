/* eslint-disable camelcase */
import { PrismaClient, Actor, IntermediaryFile, Scene } from '@prisma/client';

export async function createActor(prisma: PrismaClient, actor: Actor): Promise<Actor> {
    const { IndividualName, OrganizationName, idUnit } = actor;
    const createSystemObject: Actor = await prisma.actor.create({
        data: {
            IndividualName,
            OrganizationName,
            Unit:               idUnit ? { connect: { idUnit }, } : undefined,
            SystemObject:       { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createIntermediaryFile(prisma: PrismaClient, intermediaryFile: IntermediaryFile): Promise<IntermediaryFile> {
    const { idAsset, DateCreated } = intermediaryFile;
    const createSystemObject: IntermediaryFile = await prisma.intermediaryFile.create({
        data: {
            Asset:          { connect: { idAsset }, },
            DateCreated,
            SystemObject:   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createScene(prisma: PrismaClient, scene: Scene): Promise<Scene> {
    const { Name, idAssetThumbnail, IsOriented, HasBeenQCd } = scene;
    const createSystemObject: Scene = await prisma.scene.create({
        data: {
            Name,
            Asset:              idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
            IsOriented,
            HasBeenQCd,
            SystemObject:       { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}
