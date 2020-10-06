import * as DBAPI from '../../../db';
import { Unit as UnitBase } from '@prisma/client';

export async function createUnitTest(base: UnitBase): Promise<DBAPI.Unit> {
    const unit: DBAPI.Unit = new DBAPI.Unit(base);
    const created: boolean = await unit.create();
    expect(created).toBeTruthy();
    expect(unit.idUnit).toBeGreaterThan(0);
    return unit;
}