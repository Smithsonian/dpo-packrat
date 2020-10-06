/* eslint-disable camelcase */
import { AccessRole as AccessRoleBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class AccessRole extends DBC.DBObject<AccessRoleBase> implements AccessRoleBase {
    idAccessRole!: number;
    Name!: string;

    constructor(input: AccessRoleBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name } = this;
            ({ idAccessRole: this.idAccessRole, Name: this.Name } = await DBC.DBConnection.prisma.accessRole.create({
                data: { Name, }
            }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessRole.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAccessRole, Name } = this;
            return await DBC.DBConnection.prisma.accessRole.update({
                where: { idAccessRole, },
                data: { Name, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessRole.update', error);
            return false;
        }
    }

    static async fetch(idAccessRole: number): Promise<AccessRole | null> {
        if (!idAccessRole)
            return null;
        try {
            return DBC.CopyObject<AccessRoleBase, AccessRole>(
                await DBC.DBConnection.prisma.accessRole.findOne({ where: { idAccessRole, }, }), AccessRole);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessRole.fetch', error);
            return null;
        }
    }

    static async fetchFromXref(idAccessAction: number): Promise<AccessRole[] | null> {
        if (!idAccessAction)
            return null;
        try {
            return DBC.CopyArray<AccessRoleBase, AccessRole>(
                await DBC.DBConnection.prisma.accessRole.findMany({
                    where: {
                        AccessRoleAccessActionXref: {
                            some: { idAccessAction },
                        },
                    },
                }), AccessRole);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessRole.fetchFromXref', error);
            return null;
        }
    }
}