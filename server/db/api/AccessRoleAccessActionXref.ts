/* eslint-disable camelcase */
import { AccessRoleAccessActionXref as AccessRoleAccessActionXrefBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class AccessRoleAccessActionXref extends DBC.DBObject<AccessRoleAccessActionXrefBase> implements AccessRoleAccessActionXrefBase {
    idAccessRoleAccessActionXref!: number;
    idAccessRole!: number;
    idAccessAction!: number;

    constructor(input: AccessRoleAccessActionXrefBase) {
        super(input);
    }

    public fetchTableName(): string { return 'AccessRoleAccessActionXref'; }
    public fetchID(): number { return this.idAccessRoleAccessActionXref; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idAccessRole, idAccessAction } = this;
            ({ idAccessRoleAccessActionXref: this.idAccessRoleAccessActionXref,
                idAccessRole: this.idAccessRole, idAccessAction: this.idAccessAction } =
                await DBC.DBConnection.prisma.accessRoleAccessActionXref.create({
                    data: {
                        AccessRole:     { connect: { idAccessRole }, },
                        AccessAction:   { connect: { idAccessAction }, },
                    }
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.AccessRoleAccessActionXref.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAccessRoleAccessActionXref, idAccessRole, idAccessAction } = this;
            return await DBC.DBConnection.prisma.accessRoleAccessActionXref.update({
                where: { idAccessRoleAccessActionXref, },
                data: {
                    AccessRole:     { connect: { idAccessRole }, },
                    AccessAction:   { connect: { idAccessAction }, },
                }
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.AccessRoleAccessActionXref.update', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idAccessRoleAccessActionXref: number): Promise<AccessRoleAccessActionXref | null> {
        if (!idAccessRoleAccessActionXref)
            return null;
        try {
            return DBC.CopyObject<AccessRoleAccessActionXrefBase, AccessRoleAccessActionXref>(
                await DBC.DBConnection.prisma.accessRoleAccessActionXref.findUnique({ where: { idAccessRoleAccessActionXref, }, }), AccessRoleAccessActionXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.AccessRoleAccessActionXref.fetch', LOG.LS.eDB, error);
            return null;
        }
    }
}
