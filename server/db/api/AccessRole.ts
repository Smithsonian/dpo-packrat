/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { AccessRole as AccessRoleBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class AccessRole extends DBO.DBObject<AccessRoleBase> implements AccessRoleBase {
    idAccessRole!: number;
    Name!: string;

    constructor(input: AccessRoleBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name } = this;
            ({ idAccessRole: this.idAccessRole, Name: this.Name } = await DBConnectionFactory.prisma.accessRole.create({
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
            return await DBConnectionFactory.prisma.accessRole.update({
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
            return DBO.CopyObject<AccessRoleBase, AccessRole>(
                await DBConnectionFactory.prisma.accessRole.findOne({ where: { idAccessRole, }, }), AccessRole);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessRole.fetch', error);
            return null;
        }
    }

    static async fetchFromXref(idAccessAction: number): Promise<AccessRole[] | null> {
        if (!idAccessAction)
            return null;
        try {
            return DBO.CopyArray<AccessRoleBase, AccessRole>(
                await DBConnectionFactory.prisma.accessRole.findMany({
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