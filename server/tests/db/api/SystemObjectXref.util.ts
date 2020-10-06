import * as DBAPI from '../../../db';
import { SystemObjectXref as SystemObjectXrefBase } from '@prisma/client';

export async function createSystemObjectXrefTest(base: SystemObjectXrefBase): Promise<DBAPI.SystemObjectXref> {
    const systemObjectXref: DBAPI.SystemObjectXref = new DBAPI.SystemObjectXref(base);
    const created: boolean = await systemObjectXref.create();
    expect(created).toBeTruthy();
    expect(systemObjectXref.idSystemObjectXref).toBeGreaterThan(0);
    return systemObjectXref;
}

export async function createXref(master: DBAPI.SystemObjectBased | null, derived: DBAPI.SystemObjectBased | null): Promise<DBAPI.SystemObjectXref> {
    const SOMaster: DBAPI.SystemObject | null = master ? await master.fetchSystemObject() : null;
    const SODerived: DBAPI.SystemObject | null = derived ? await derived.fetchSystemObject() : null;
    expect(SOMaster).toBeTruthy();
    expect(SODerived).toBeTruthy();
    return await createSystemObjectXrefTest({
        idSystemObjectMaster: SOMaster ? SOMaster.idSystemObject : /* istanbul ignore next */ 0,
        idSystemObjectDerived: SODerived ? SODerived.idSystemObject : /* istanbul ignore next */ 0,
        idSystemObjectXref: 0
    });
}
