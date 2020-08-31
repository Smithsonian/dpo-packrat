import * as DBAPI from '../../../db';
import { CaptureData as CaptureDataBase } from '@prisma/client';

export async function createCaptureDataTest(base: CaptureDataBase): Promise<DBAPI.CaptureData> {
    const captureData: DBAPI.CaptureData = new DBAPI.CaptureData(base);
    const created: boolean = await captureData.create();
    expect(created).toBeTruthy();
    expect(captureData.idCaptureData).toBeGreaterThan(0);
    return captureData;
}