import * as DBAPI from '../../../db';
import { SystemObjectXref as SystemObjectXrefBase } from '@prisma/client';

export async function createSystemObjectXrefTest(base: SystemObjectXrefBase): Promise<DBAPI.SystemObjectXref> {
    const systemObjectXref: DBAPI.SystemObjectXref = new DBAPI.SystemObjectXref(base);
    const created: boolean = await systemObjectXref.create();
    expect(created).toBeTruthy();
    expect(systemObjectXref.idSystemObjectXref).toBeGreaterThan(0);
    return systemObjectXref;
}

export async function createXref(master: DBAPI.SystemObjectBased, derived: DBAPI.SystemObjectBased): Promise<DBAPI.SystemObjectXref> {
    const SOMaster: DBAPI.SystemObject | null = await master.fetchSystemObject();
    const SODerived: DBAPI.SystemObject | null = await derived.fetchSystemObject();
    expect(SOMaster).toBeTruthy();
    expect(SODerived).toBeTruthy();
    return await createSystemObjectXrefTest({
        idSystemObjectMaster: SOMaster ? SOMaster.idSystemObject : /* istanbul ignore next */ 0,
        idSystemObjectDerived: SODerived ? SODerived.idSystemObject : /* istanbul ignore next */ 0,
        idSystemObjectXref: 0
    });
}
