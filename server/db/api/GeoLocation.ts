/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
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

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = this;
            ({ idGeoLocation: this.idGeoLocation, Latitude: this.Latitude, Longitude: this.Longitude, Altitude: this.Altitude,
                TS0: this.TS0, TS1: this.TS1, TS2: this.TS2, R0: this.R0, R1: this.R1, R2: this.R2, R3: this.R3 } =
                await DBConnectionFactory.prisma.geoLocation.create({
                    data: { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.GeoLocation.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idGeoLocation, Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = this;
            return await DBConnectionFactory.prisma.geoLocation.update({
                where: { idGeoLocation, },
                data: { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.GeoLocation.update', error);
            return false;
        }
    }

    static async fetch(idGeoLocation: number): Promise<GeoLocation | null> {
        if (!idGeoLocation)
            return null;
        try {
            return DBO.CopyObject<GeoLocationBase, GeoLocation>(
                await DBConnectionFactory.prisma.geoLocation.findOne({ where: { idGeoLocation, }, }), GeoLocation);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.GeoLocation.fetch', error);
            return null;
        }
    }
}
