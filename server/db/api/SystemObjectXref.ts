/* eslint-disable camelcase */
import { SystemObjectXref as SystemObjectXrefBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class SystemObjectXref extends DBO.DBObject<SystemObjectXrefBase> implements SystemObjectXrefBase {
    idSystemObjectXref!: number;
    idSystemObjectDerived!: number;
    idSystemObjectMaster!: number;

    constructor(input: SystemObjectXrefBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idSystemObjectMaster, idSystemObjectDerived } = this;
            ({ idSystemObjectXref: this.idSystemObjectXref, idSystemObjectMaster: this.idSystemObjectMaster,
                idSystemObjectDerived: this.idSystemObjectDerived } =
                await DBConnectionFactory.prisma.systemObjectXref.create({
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

    async update(): Promise<boolean> {
        try {
            const { idSystemObjectXref, idSystemObjectMaster, idSystemObjectDerived } = this;
            return await DBConnectionFactory.prisma.systemObjectXref.update({
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
            return DBO.CopyObject<SystemObjectXrefBase, SystemObjectXref>(
                await DBConnectionFactory.prisma.systemObjectXref.findOne({ where: { idSystemObjectXref, }, }), SystemObjectXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectXref.fetch', error);
            return null;
        }
    }
}
