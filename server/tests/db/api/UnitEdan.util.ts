import * as DBAPI from '../../../db';
import { UnitEdan as UnitEdanBase } from '@prisma/client';

export async function createUnitEdanTest(base: UnitEdanBase): Promise<DBAPI.UnitEdan> {
    const unitEdan: DBAPI.UnitEdan = new DBAPI.UnitEdan(base);
    const created: boolean = await unitEdan.create();
    expect(created).toBeTruthy();
    expect(unitEdan.idUnitEdan).toBeGreaterThan(0);
    return unitEdan;
}