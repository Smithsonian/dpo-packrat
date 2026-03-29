import { CreateGeoLocationResult, MutationCreateGeoLocationArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';

export default async function createGeoLocation(_: Parent, args: MutationCreateGeoLocationArgs): Promise<CreateGeoLocationResult> {
    const ctx = Authorization.getContext();
    if (!ctx || (!ctx.isAdmin && ctx.authorizedUnitIds.length === 0))
        throw new Error(AUTH_ERROR.ACCESS_DENIED);

    const { input } = args;
    const { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = input;

    const geoLocationtArgs = {
        idGeoLocation: 0,
        Latitude: Latitude || null,
        Longitude: Longitude || null,
        Altitude: Altitude || null,
        TS0: TS0 || null,
        TS1: TS1 || null,
        TS2: TS2 || null,
        R0: R0 || null,
        R1: R1 || null,
        R2: R2 || null,
        R3: R3 || null
    };

    const GeoLocation = new DBAPI.GeoLocation(geoLocationtArgs);
    await GeoLocation.create();

    return { GeoLocation };
}
