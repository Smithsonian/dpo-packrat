/* eslint-disable camelcase */
import { AccessPolicy as AccessPolicyBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class AccessPolicy extends DBC.DBObject<AccessPolicyBase> implements AccessPolicyBase {
    idAccessContext!: number;
    idAccessPolicy!: number;
    idAccessRole!: number;
    idUser!: number;

    constructor(input: AccessPolicyBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idUser, idAccessRole, idAccessContext } = this;
            ({ idAccessPolicy: this.idAccessPolicy, idUser: this.idUser,
                idAccessRole: this.idAccessRole, idAccessContext: this.idAccessContext } =
                await DBC.DBConnection.prisma.accessPolicy.create({
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

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAccessPolicy, idUser, idAccessRole, idAccessContext } = this;
            return await DBC.DBConnection.prisma.accessPolicy.update({
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
            return DBC.CopyObject<AccessPolicyBase, AccessPolicy>(
                await DBC.DBConnection.prisma.accessPolicy.findUnique({ where: { idAccessPolicy, }, }), AccessPolicy);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessPolicy.fetch', error);
            return null;
        }
    }

    static async fetchFromAccessContext(idAccessContext: number): Promise<AccessPolicy[] | null> {
        if (!idAccessContext)
            return null;
        try {
            return DBC.CopyArray<AccessPolicyBase, AccessPolicy>(
                await DBC.DBConnection.prisma.accessPolicy.findMany({ where: { idAccessContext } }), AccessPolicy);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessPolicy.fetchFromAccessContext', error);
            return null;
        }
    }

    static async fetchFromUser(idUser: number): Promise<AccessPolicy[] | null> {
        if (!idUser)
            return null;
        try {
            return DBC.CopyArray<AccessPolicyBase, AccessPolicy>(
                await DBC.DBConnection.prisma.accessPolicy.findMany({ where: { idUser } }), AccessPolicy);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessPolicy.fetchFromUser', error);
            return null;
        }
    }
}