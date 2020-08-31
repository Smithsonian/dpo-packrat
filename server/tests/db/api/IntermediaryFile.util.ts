import * as DBAPI from '../../../db';
import { IntermediaryFile as IntermediaryFileBase } from '@prisma/client';

export async function createIntermediaryFileTest(base: IntermediaryFileBase): Promise<DBAPI.IntermediaryFile> {
    const intermediaryFile: DBAPI.IntermediaryFile = new DBAPI.IntermediaryFile(base);
    const created: boolean = await intermediaryFile.create();
    expect(created).toBeTruthy();
    expect(intermediaryFile.idIntermediaryFile).toBeGreaterThan(0);
    return intermediaryFile;
}