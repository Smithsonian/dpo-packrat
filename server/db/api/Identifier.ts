import { PrismaClient, Identifier } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createIdentifier(prisma: PrismaClient, identifier: Identifier): Promise<Identifier | null> {
    let createSystemObject: Identifier;
    const { IdentifierValue, idVIdentifierType, idSystemObject } = identifier;
    try {
        createSystemObject = await prisma.identifier.create({
            data: {
                IdentifierValue,
                Vocabulary: { connect: { idVocabulary: idVIdentifierType }, },
                SystemObject: idSystemObject ? { connect: { idSystemObject }, } : undefined,
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createIdentifier', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchIdentifier(prisma: PrismaClient, idIdentifier: number): Promise<Identifier | null> {
    try {
        return await prisma.identifier.findOne({ where: { idIdentifier, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchIdentifier', error);
        return null;
    }
}

export async function fetchIdentifierFromSystemObject(prisma: PrismaClient, idSystemObject: number): Promise<Identifier[] | null> {
    try {
        return await prisma.identifier.findMany({ where: { idSystemObject } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchIdentifierFromSystemObject', error);
        return null;
    }
}