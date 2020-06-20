import * as DBAPI from '../../../db/api';
import { PrismaClient, Scene, Subject, SystemObject } from '@prisma/client';

export async function testFetchSystemObjectSubject(prisma: PrismaClient, subject: Subject): Promise<SystemObject | null> {
    try {
        return await DBAPI.fetchSystemObjectForSubject(prisma, subject);
    } catch (error) {
        console.error(`fetchSystemObjectForScene: ${error}`);
        return null;
    }
}

export async function testFetchSystemObjectScene(prisma: PrismaClient, scene: Scene): Promise<SystemObject | null> {
    try {
        return await DBAPI.fetchSystemObjectForScene(prisma, scene);
    } catch (error) {
        console.error(`fetchSystemObjectForScene: ${error}`);
        return null;
    }
}