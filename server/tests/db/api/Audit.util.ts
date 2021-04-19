import * as DBAPI from '../../../db';
import { Audit as AuditBase } from '@prisma/client';

export async function createAuditTest(base: AuditBase): Promise<DBAPI.Audit> {
    const audit: DBAPI.Audit = new DBAPI.Audit(base);
    const created: boolean = await audit.create();
    expect(created).toBeTruthy();
    expect(audit.idAudit).toBeGreaterThan(0);
    return audit;
}