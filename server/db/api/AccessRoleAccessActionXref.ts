/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { AccessRoleAccessActionXref as AccessRoleAccessActionXrefBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class AccessRoleAccessActionXref extends DBC.DBObject<AccessRoleAccessActionXrefBase> implements AccessRoleAccessActionXrefBase {
    idAccessAction!: number;
    idAccessRole!: number;
    idAccessRoleAccessActionXref!: number;

    constructor(input: AccessRoleAccessActionXrefBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

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
            LOG.logger.error('DBAPI.AccessRoleAccessActionXref.create', error);
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
            LOG.logger.error('DBAPI.AccessRoleAccessActionXref.update', error);
            return false;
        }
    }

    static async fetch(idAccessRoleAccessActionXref: number): Promise<AccessRoleAccessActionXref | null> {
        if (!idAccessRoleAccessActionXref)
            return null;
        try {
            return DBC.CopyObject<AccessRoleAccessActionXrefBase, AccessRoleAccessActionXref>(
                await DBC.DBConnection.prisma.accessRoleAccessActionXref.findOne({ where: { idAccessRoleAccessActionXref, }, }), AccessRoleAccessActionXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessRoleAccessActionXref.fetch', error);
            return null;
        }
    }
}
