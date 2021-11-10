import * as DBAPI from '../../../db';
import { Sentinel as SentinelBase } from '@prisma/client';

export async function createSentinelTest(base: SentinelBase): Promise<DBAPI.Sentinel> {
    const sentinel: DBAPI.Sentinel = new DBAPI.Sentinel(base);
    const created: boolean = await sentinel.create();
    expect(created).toBeTruthy();
    expect(sentinel.idSentinel).toBeGreaterThan(0);
    return sentinel;
}