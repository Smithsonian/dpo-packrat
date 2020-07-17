/* eslint-disable camelcase */
import { AccessRoleAccessActionXref as AccessRoleAccessActionXrefBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class AccessRoleAccessActionXref extends DBO.DBObject<AccessRoleAccessActionXrefBase> implements AccessRoleAccessActionXrefBase {
    idAccessAction!: number;
    idAccessRole!: number;
    idAccessRoleAccessActionXref!: number;

    constructor(input: AccessRoleAccessActionXrefBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idAccessRole, idAccessAction } = this;
            ({ idAccessRoleAccessActionXref: this.idAccessRoleAccessActionXref,
                idAccessRole: this.idAccessRole, idAccessAction: this.idAccessAction } =
                await DBConnectionFactory.prisma.accessRoleAccessActionXref.create({
                    data: {
                        AccessRole:     { connect: { idAccessRole }, },
                        AccessAction:   { connect: { idAccessAction }, },
                    }
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessRoleAccessActionXref.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idAccessRoleAccessActionXref, idAccessRole, idAccessAction } = this;
            return await DBConnectionFactory.prisma.accessRoleAccessActionXref.update({
                where: { idAccessRoleAccessActionXref, },
                data: {
                    AccessRole:     { connect: { idAccessRole }, },
                    AccessAction:   { connect: { idAccessAction }, },
                }
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessRoleAccessActionXref.update', error);
            return false;
        }
    }

    static async fetch(idAccessRoleAccessActionXref: number): Promise<AccessRoleAccessActionXref | null> {
        if (!idAccessRoleAccessActionXref)
            return null;
        try {
            return DBO.CopyObject<AccessRoleAccessActionXrefBase, AccessRoleAccessActionXref>(
                await DBConnectionFactory.prisma.accessRoleAccessActionXref.findOne({ where: { idAccessRoleAccessActionXref, }, }), AccessRoleAccessActionXref);
        } catch (error) {
            LOG.logger.error('DBAPI.AccessRoleAccessActionXref.fetch', error);
            return null;
        }
    }
}
