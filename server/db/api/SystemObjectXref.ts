/* eslint-disable camelcase */
import { SystemObjectXref as SystemObjectXrefBase } from '@prisma/client';
import { SystemObjectBased, SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class SystemObjectXref extends DBC.DBObject<SystemObjectXrefBase> implements SystemObjectXrefBase {
    idSystemObjectXref!: number;
    idSystemObjectDerived!: number;
    idSystemObjectMaster!: number;

    constructor(input: SystemObjectXrefBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idSystemObjectMaster, idSystemObjectDerived } = this;
            ({ idSystemObjectXref: this.idSystemObjectXref, idSystemObjectMaster: this.idSystemObjectMaster,
                idSystemObjectDerived: this.idSystemObjectDerived } =
                await DBC.DBConnection.prisma.systemObjectXref.create({
                    data: {
                        SystemObject_SystemObjectToSystemObjectXref_idSystemObjectMaster:  { connect: { idSystemObject: idSystemObjectMaster }, },
                        SystemObject_SystemObjectToSystemObjectXref_idSystemObjectDerived: { connect: { idSystemObject: idSystemObjectDerived }, },
                    }
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectXref.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idSystemObjectXref, idSystemObjectMaster, idSystemObjectDerived } = this;
            return await DBC.DBConnection.prisma.systemObjectXref.update({
                where: { idSystemObjectXref, },
                data: {
                    SystemObject_SystemObjectToSystemObjectXref_idSystemObjectMaster:  { connect: { idSystemObject: idSystemObjectMaster }, },
                    SystemObject_SystemObjectToSystemObjectXref_idSystemObjectDerived: { connect: { idSystemObject: idSystemObjectDerived }, },
                }
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectXref.update', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idSystemObjectXref: number): Promise<SystemObjectXref | null> {
        if (!idSystemObjectXref)
            return null;
        try {
            return DBC.CopyObject<SystemObjectXrefBase, SystemObjectXref>(
                await DBC.DBConnection.prisma.systemObjectXref.findUnique({ where: { idSystemObjectXref, }, }), SystemObjectXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectXref.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchXref(idSystemObjectMaster: number, idSystemObjectDerived: number): Promise<SystemObjectXref[] | null> {
        if (!idSystemObjectMaster || !idSystemObjectDerived)
            return null;
        try {
            return DBC.CopyArray<SystemObjectXrefBase, SystemObjectXref>(
                await DBC.DBConnection.prisma.systemObjectXref.findMany({
                    where: { AND: [ { idSystemObjectMaster }, { idSystemObjectDerived }, ] }, }), SystemObjectXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectXref.fetchXref', LOG.LS.eDB, error);
            return null;
        }
    }

    static async wireObjectsIfNeeded(master: SystemObjectBased, derived: SystemObjectBased): Promise<SystemObjectXref | null> {
        const SOMaster: SystemObject | null = await master.fetchSystemObject(); /* istanbul ignore next */
        if (!SOMaster) {
            LOG.error(`DBAPI.SystemObjectXref.wireObjectsIfNeeded Unable to compute SystemObject for ${JSON.stringify(master)}`, LOG.LS.eDB);
            return null;
        }

        const SODerived: SystemObject | null = await derived.fetchSystemObject(); /* istanbul ignore next */
        if (!SODerived) {
            LOG.error(`DBAPI.SystemObjectXref.wireObjectsIfNeeded Unable to compute SystemObject for ${JSON.stringify(derived)}`, LOG.LS.eDB);
            return null;
        }

        const idSystemObjectMaster: number = SOMaster.idSystemObject;
        const idSystemObjectDerived: number = SODerived.idSystemObject;
        const xrefs: SystemObjectXref[] | null = await this.fetchXref(idSystemObjectMaster, idSystemObjectDerived);
        if (xrefs && xrefs.length > 0)
            return xrefs[0];

        const xref: SystemObjectXref | null = new SystemObjectXref({ idSystemObjectMaster, idSystemObjectDerived, idSystemObjectXref: 0 });
        return (await xref.create()) ? xref : /* istanbul ignore next */ null;
    }
}
