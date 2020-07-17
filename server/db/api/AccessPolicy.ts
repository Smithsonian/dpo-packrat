/* eslint-disable camelcase */
import { AccessPolicy as AccessPolicyBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class AccessPolicy extends DBO.DBObject<AccessPolicyBase> implements AccessPolicyBase {
    idAccessContext!: number;
    idAccessPolicy!: number;
    idAccessRole!: number;
    idUser!: number;

    constructor(input: AccessPolicyBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idUser, idAccessRole, idAccessContext } = this;
            ({ idAccessPolicy: this.idAccessPolicy, idUser: this.idUser,
                idAccessRole: this.idAccessRole, idAccessContext: this.idAccessContext } =
                await DBConnectionFactory.prisma.accessPolicy.create({
                    data: {
                        User:           { connect: { idUser }, },
                        AccessRole:     { connect: { idAccessRole }, },
                        AccessContext:  { connect: { idAccessContext }, },
                    }
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessPolicy.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idAccessPolicy, idUser, idAccessRole, idAccessContext } = this;
            return await DBConnectionFactory.prisma.accessPolicy.update({
                where: { idAccessPolicy, },
                data: {
                    User:           { connect: { idUser }, },
                    AccessRole:     { connect: { idAccessRole }, },
                    AccessContext:  { connect: { idAccessContext }, },
                }
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessPolicy.update', error);
            return false;
        }
    }

    static async fetch(idAccessPolicy: number): Promise<AccessPolicy | null> {
        if (!idAccessPolicy)
            return null;
        try {
            return DBO.CopyObject<AccessPolicyBase, AccessPolicy>(
                await DBConnectionFactory.prisma.accessPolicy.findOne({ where: { idAccessPolicy, }, }), AccessPolicy);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessPolicy.fetch', error);
            return null;
        }
    }

    static async fetchFromAccessContext(idAccessContext: number): Promise<AccessPolicy[] | null> {
        if (!idAccessContext)
            return null;
        try {
            return DBO.CopyArray<AccessPolicyBase, AccessPolicy>(
                await DBConnectionFactory.prisma.accessPolicy.findMany({ where: { idAccessContext } }), AccessPolicy);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessPolicy.fetchFromAccessContext', error);
            return null;
        }
    }

    static async fetchFromUser(idUser: number): Promise<AccessPolicy[] | null> {
        if (!idUser)
            return null;
        try {
            return DBO.CopyArray<AccessPolicyBase, AccessPolicy>(
                await DBConnectionFactory.prisma.accessPolicy.findMany({ where: { idUser } }), AccessPolicy);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessPolicy.fetchFromUser', error);
            return null;
        }
    }
}