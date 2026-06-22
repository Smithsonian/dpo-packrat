import * as DBAPI from '../../../db';
import { CaptureDataVolume as CaptureDataVolumeBase } from '@prisma/client';

export async function createCaptureDataVolumeTest(base: CaptureDataVolumeBase): Promise<DBAPI.CaptureDataVolume> {
    const captureDataVolume: DBAPI.CaptureDataVolume = new DBAPI.CaptureDataVolume(base);
    const created: boolean = await captureDataVolume.create();
    expect(created).toBeTruthy();
    expect(captureDataVolume.idCaptureDataVolume).toBeGreaterThan(0);
    return captureDataVolume;
}
