/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { SystemObjectXref as SystemObjectXrefBase } from '@prisma/client';
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
            LOG.logger.error('DBAPI.SystemObjectXref.create', error);
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
            LOG.logger.error('DBAPI.SystemObjectXref.update', error);
            return false;
        }
    }

    static async fetch(idSystemObjectXref: number): Promise<SystemObjectXref | null> {
        if (!idSystemObjectXref)
            return null;
        try {
            return DBC.CopyObject<SystemObjectXrefBase, SystemObjectXref>(
                await DBC.DBConnection.prisma.systemObjectXref.findOne({ where: { idSystemObjectXref, }, }), SystemObjectXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectXref.fetch', error);
            return null;
        }
    }
}
