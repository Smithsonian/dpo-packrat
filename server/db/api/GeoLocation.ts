/* eslint-disable camelcase */
import { GeoLocation as GeoLocationBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class GeoLocation extends DBO.DBObject<GeoLocationBase> implements GeoLocationBase {
    idGeoLocation!: number;
    Altitude!: number | null;
    Latitude!: number | null;
    Longitude!: number | null;
    R0!: number | null;
    R1!: number | null;
    R2!: number | null;
    R3!: number | null;
    TS0!: number | null;
    TS1!: number | null;
    TS2!: number | null;

    constructor(input: GeoLocationBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = this;
            ({ idGeoLocation: this.idGeoLocation, Latitude: this.Latitude, Longitude: this.Longitude, Altitude: this.Altitude,
                TS0: this.TS0, TS1: this.TS1, TS2: this.TS2, R0: this.R0, R1: this.R1, R2: this.R2, R3: this.R3 } =
                await DBConnectionFactory.prisma.geoLocation.create({
                    data: { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 },
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.GeoLocation.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idGeoLocation, Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = this;
            return await DBConnectionFactory.prisma.geoLocation.update({
                where: { idGeoLocation, },
                data: { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.GeoLocation.update', error);
            return false;
        }
    }

    static async fetch(idGeoLocation: number): Promise<GeoLocation | null> {
        try {
            return DBO.CopyObject<GeoLocationBase, GeoLocation>(
                await DBConnectionFactory.prisma.geoLocation.findOne({ where: { idGeoLocation, }, }), GeoLocation);
        } catch (error) {
            LOG.logger.error('DBAPI.GeoLocation.fetch', error);
            return null;
        }
    }

/*
    static async fetchFromXref(idAccessRole: number): Promise<GeoLocation[] | null> {
        try {
            return DBO.CopyArray<GeoLocationBase, GeoLocation>(
                await DBConnectionFactory.prisma.geoLocation.findMany({
                    where: {
                        AccessRoleGeoLocationXref: {
                            some: { idAccessRole },
                        },
                    },
                }), GeoLocation);
        } catch (error) {
            LOG.logger.error('DBAPI.GeoLocation.fetchFromXref', error);
            return null;
        }
    }

    test('DB Update: GeoLocation.update', async () => {
        let bUpdated: boolean = false;
        if (geoLocation) {
            const updatedName: string = 'Updated Test Access Action';
            geoLocation.Name   = updatedName;
            bUpdated            = await geoLocation.update();

            const geoLocationFetch: DBAPI.GeoLocation | null = await DBAPI.GeoLocation.fetch(geoLocation.idGeoLocation);
            expect(geoLocationFetch).toBeTruthy();
            if (geoLocationFetch)
                expect(geoLocationFetch.Name).toBe(updatedName);
        }
        expect(bUpdated).toBeTruthy();
    });
*/
}
