/* eslint-disable camelcase */
import { PrismaClient, GeoLocation } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createGeoLocation(prisma: PrismaClient, geoLocation: GeoLocation): Promise<GeoLocation | null> {
    let createSystemObject: GeoLocation;
    const { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = geoLocation;
    try {
        createSystemObject = await prisma.geoLocation.create({
            data: {
                Latitude,
                Longitude,
                Altitude,
                TS0,
                TS1,
                TS2,
                R0,
                R1,
                R2,
                R3
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createGeoLocation', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchGeoLocation(prisma: PrismaClient, idGeoLocation: number): Promise<GeoLocation | null> {
    try {
        return await prisma.geoLocation.findOne({ where: { idGeoLocation, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchGeoLocation', error);
        return null;
    }
}