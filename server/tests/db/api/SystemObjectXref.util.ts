import * as DBAPI from '../../../db';
import { SystemObjectXref as SystemObjectXrefBase } from '@prisma/client';

export async function createSystemObjectXrefTest(base: SystemObjectXrefBase): Promise<DBAPI.SystemObjectXref> {
    const systemObjectXref: DBAPI.SystemObjectXref = new DBAPI.SystemObjectXref(base);
    const created: boolean = await systemObjectXref.create();
    expect(created).toBeTruthy();
    expect(systemObjectXref.idSystemObjectXref).toBeGreaterThan(0);
    return systemObjectXref;
}

export async function createXrefUnitProject(master: DBAPI.Unit, derived: DBAPI.Project): Promise<DBAPI.SystemObjectXref> {
    const SOMaster: DBAPI.SystemObject | null = await master.fetchSystemObject();
    const SODerived: DBAPI.SystemObject | null = await derived.fetchSystemObject();
    expect(SOMaster).toBeTruthy();
    expect(SODerived).toBeTruthy();
    return await createSystemObjectXrefTest({
        idSystemObjectMaster: SOMaster ? SOMaster.idSystemObject : 0,
        idSystemObjectDerived: SODerived ? SODerived.idSystemObject : 0,
        idSystemObjectXref: 0
    });
}

export async function createXrefProjectSubject(master: DBAPI.Project, derived: DBAPI.Subject): Promise<DBAPI.SystemObjectXref> {
    const SOMaster: DBAPI.SystemObject | null = await master.fetchSystemObject();
    const SODerived: DBAPI.SystemObject | null = await derived.fetchSystemObject();
    expect(SOMaster).toBeTruthy();
    expect(SODerived).toBeTruthy();
    return await createSystemObjectXrefTest({
        idSystemObjectMaster: SOMaster ? SOMaster.idSystemObject : 0,
        idSystemObjectDerived: SODerived ? SODerived.idSystemObject : 0,
        idSystemObjectXref: 0
    });
}

export async function createXrefSubjectItem(master: DBAPI.Subject, derived: DBAPI.Item): Promise<DBAPI.SystemObjectXref> {
    const SOMaster: DBAPI.SystemObject | null = await master.fetchSystemObject();
    const SODerived: DBAPI.SystemObject | null = await derived.fetchSystemObject();
    expect(SOMaster).toBeTruthy();
    expect(SODerived).toBeTruthy();
    return await createSystemObjectXrefTest({
        idSystemObjectMaster: SOMaster ? SOMaster.idSystemObject : 0,
        idSystemObjectDerived: SODerived ? SODerived.idSystemObject : 0,
        idSystemObjectXref: 0
    });
}

export async function createXrefItemCaptureData(master: DBAPI.Item, derived: DBAPI.CaptureData): Promise<DBAPI.SystemObjectXref> {
    const SOMaster: DBAPI.SystemObject | null = await master.fetchSystemObject();
    const SODerived: DBAPI.SystemObject | null = await derived.fetchSystemObject();
    expect(SOMaster).toBeTruthy();
    expect(SODerived).toBeTruthy();
    return await createSystemObjectXrefTest({
        idSystemObjectMaster: SOMaster ? SOMaster.idSystemObject : 0,
        idSystemObjectDerived: SODerived ? SODerived.idSystemObject : 0,
        idSystemObjectXref: 0
    });
}

export async function createXrefItemModel(master: DBAPI.Item, derived: DBAPI.Model): Promise<DBAPI.SystemObjectXref> {
    const SOMaster: DBAPI.SystemObject | null = await master.fetchSystemObject();
    const SODerived: DBAPI.SystemObject | null = await derived.fetchSystemObject();
    expect(SOMaster).toBeTruthy();
    expect(SODerived).toBeTruthy();
    return await createSystemObjectXrefTest({
        idSystemObjectMaster: SOMaster ? SOMaster.idSystemObject : 0,
        idSystemObjectDerived: SODerived ? SODerived.idSystemObject : 0,
        idSystemObjectXref: 0
    });
}

export async function createXrefItemScene(master: DBAPI.Item, derived: DBAPI.Scene): Promise<DBAPI.SystemObjectXref> {
    const SOMaster: DBAPI.SystemObject | null = await master.fetchSystemObject();
    const SODerived: DBAPI.SystemObject | null = await derived.fetchSystemObject();
    expect(SOMaster).toBeTruthy();
    expect(SODerived).toBeTruthy();
    return await createSystemObjectXrefTest({
        idSystemObjectMaster: SOMaster ? SOMaster.idSystemObject : 0,
        idSystemObjectDerived: SODerived ? SODerived.idSystemObject : 0,
        idSystemObjectXref: 0
    });
}

export async function createXrefModelModel(master: DBAPI.Model, derived: DBAPI.Model): Promise<DBAPI.SystemObjectXref> {
    const SOMaster: DBAPI.SystemObject | null = await master.fetchSystemObject();
    const SODerived: DBAPI.SystemObject | null = await derived.fetchSystemObject();
    expect(SOMaster).toBeTruthy();
    expect(SODerived).toBeTruthy();
    return await createSystemObjectXrefTest({
        idSystemObjectMaster: SOMaster ? SOMaster.idSystemObject : 0,
        idSystemObjectDerived: SODerived ? SODerived.idSystemObject : 0,
        idSystemObjectXref: 0
    });
}

export async function createXrefCaptureDataModel(master: DBAPI.CaptureData, derived: DBAPI.Model): Promise<DBAPI.SystemObjectXref> {
    const SOMaster: DBAPI.SystemObject | null = await master.fetchSystemObject();
    const SODerived: DBAPI.SystemObject | null = await derived.fetchSystemObject();
    expect(SOMaster).toBeTruthy();
    expect(SODerived).toBeTruthy();
    return await createSystemObjectXrefTest({
        idSystemObjectMaster: SOMaster ? SOMaster.idSystemObject : 0,
        idSystemObjectDerived: SODerived ? SODerived.idSystemObject : 0,
        idSystemObjectXref: 0
    });
}

export async function createXrefSceneModel(master: DBAPI.Scene, derived: DBAPI.Model): Promise<DBAPI.SystemObjectXref> {
    const SOMaster: DBAPI.SystemObject | null = await master.fetchSystemObject();
    const SODerived: DBAPI.SystemObject | null = await derived.fetchSystemObject();
    expect(SOMaster).toBeTruthy();
    expect(SODerived).toBeTruthy();
    return await createSystemObjectXrefTest({
        idSystemObjectMaster: SOMaster ? SOMaster.idSystemObject : 0,
        idSystemObjectDerived: SODerived ? SODerived.idSystemObject : 0,
        idSystemObjectXref: 0
    });
}

export async function createXrefCaptureDataAsset(master: DBAPI.CaptureData, derived: DBAPI.Asset): Promise<DBAPI.SystemObjectXref> {
    const SOMaster: DBAPI.SystemObject | null = await master.fetchSystemObject();
    const SODerived: DBAPI.SystemObject | null = await derived.fetchSystemObject();
    expect(SOMaster).toBeTruthy();
    expect(SODerived).toBeTruthy();
    return await createSystemObjectXrefTest({
        idSystemObjectMaster: SOMaster ? SOMaster.idSystemObject : 0,
        idSystemObjectDerived: SODerived ? SODerived.idSystemObject : 0,
        idSystemObjectXref: 0
    });
}

export async function createXrefModelAsset(master: DBAPI.Model, derived: DBAPI.Asset): Promise<DBAPI.SystemObjectXref> {
    const SOMaster: DBAPI.SystemObject | null = await master.fetchSystemObject();
    const SODerived: DBAPI.SystemObject | null = await derived.fetchSystemObject();
    expect(SOMaster).toBeTruthy();
    expect(SODerived).toBeTruthy();
    return await createSystemObjectXrefTest({
        idSystemObjectMaster: SOMaster ? SOMaster.idSystemObject : 0,
        idSystemObjectDerived: SODerived ? SODerived.idSystemObject : 0,
        idSystemObjectXref: 0
    });
}

export async function createXrefSceneAsset(master: DBAPI.Scene, derived: DBAPI.Asset): Promise<DBAPI.SystemObjectXref> {
    const SOMaster: DBAPI.SystemObject | null = await master.fetchSystemObject();
    const SODerived: DBAPI.SystemObject | null = await derived.fetchSystemObject();
    expect(SOMaster).toBeTruthy();
    expect(SODerived).toBeTruthy();
    return await createSystemObjectXrefTest({
        idSystemObjectMaster: SOMaster ? SOMaster.idSystemObject : 0,
        idSystemObjectDerived: SODerived ? SODerived.idSystemObject : 0,
        idSystemObjectXref: 0
    });
}
