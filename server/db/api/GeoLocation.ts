/* eslint-disable camelcase */
import { GeoLocation as GeoLocationBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class GeoLocation extends DBC.DBObject<GeoLocationBase> implements GeoLocationBase {
    idGeoLocation!: number;
    Latitude!: number | null;
    Longitude!: number | null;
    Altitude!: number | null;
    TS0!: number | null;
    TS1!: number | null;
    TS2!: number | null;
    R0!: number | null;
    R1!: number | null;
    R2!: number | null;
    R3!: number | null;

    constructor(input: GeoLocationBase) {
        super(input);
    }

    public fetchTableName(): string { return 'GeoLocation'; }
    public fetchID(): number { return this.idGeoLocation; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = this;
            ({ idGeoLocation: this.idGeoLocation, Latitude: this.Latitude, Longitude: this.Longitude, Altitude: this.Altitude,
                TS0: this.TS0, TS1: this.TS1, TS2: this.TS2, R0: this.R0, R1: this.R1, R2: this.R2, R3: this.R3 } =
                await DBC.DBConnection.prisma.geoLocation.create({
                    data: { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('create', error);
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idGeoLocation, Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = this;
            return await DBC.DBConnection.prisma.geoLocation.update({
                where: { idGeoLocation, },
                data: { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('update', error);
        }
    }

    static async fetch(idGeoLocation: number): Promise<GeoLocation | null> {
        if (!idGeoLocation)
            return null;
        try {
            return DBC.CopyObject<GeoLocationBase, GeoLocation>(
                await DBC.DBConnection.prisma.geoLocation.findUnique({ where: { idGeoLocation, }, }), GeoLocation);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.GeoLocation.fetch', LOG.LS.eDB, error);
            return null;
        }
    }
}
