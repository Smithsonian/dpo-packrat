/* eslint-disable camelcase */
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

    async create(): Promise<boolean> {
        try {
            const { Name } = this;
            ({ idAccessRole: this.idAccessRole, Name: this.Name } = await DBConnectionFactory.prisma.accessRole.create({
                data: { Name, }
            }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessRole.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idAccessRole, Name } = this;
            return await DBConnectionFactory.prisma.accessRole.update({
                where: { idAccessRole, },
                data: { Name, },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessRole.update', error);
            return false;
        }
    }

    static async fetch(idAccessRole: number): Promise<AccessRole | null> {
        try {
            return DBO.CopyObject<AccessRoleBase, AccessRole>(
                await DBConnectionFactory.prisma.accessRole.findOne({ where: { idAccessRole, }, }), AccessRole);
        } catch (error) {
            LOG.logger.error('DBAPI.AccessRole.fetch', error);
            return null;
        }
    }

    static async fetchFromXref(idAccessAction: number): Promise<AccessRole[] | null> {
        try {
            return DBO.CopyArray<AccessRoleBase, AccessRole>(
                await DBConnectionFactory.prisma.accessRole.findMany({
                    where: {
                        AccessRoleAccessActionXref: {
                            some: { idAccessAction },
                        },
                    },
                }), AccessRole);
        } catch (error) {
            LOG.logger.error('DBAPI.AccessRole.fetchFromXref', error);
            return null;
        }
    }
}