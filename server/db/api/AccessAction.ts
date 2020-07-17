/* eslint-disable camelcase */
import { AccessAction as AccessActionBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class AccessAction extends DBO.DBObject<AccessActionBase> implements AccessActionBase {
    idAccessAction!: number;
    Name!: string;
    SortOrder!: number;

    constructor(input: AccessActionBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { Name, SortOrder } = this;
            ({ idAccessAction: this.idAccessAction, Name: this.Name, SortOrder: this.SortOrder } =
                await DBConnectionFactory.prisma.accessAction.create({
                    data: {
                        Name,
                        SortOrder,
                    }
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessAction.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idAccessAction, Name, SortOrder } = this;
            return await DBConnectionFactory.prisma.accessAction.update({
                where: { idAccessAction, },
                data: { Name, SortOrder, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessAction.update', error);
            return false;
        }
    }

    static async fetch(idAccessAction: number): Promise<AccessAction | null> {
        if (!idAccessAction)
            return null;
        try {
            return DBO.CopyObject<AccessActionBase, AccessAction>(
                await DBConnectionFactory.prisma.accessAction.findOne({ where: { idAccessAction, }, }), AccessAction);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessAction.fetch', error);
            return null;
        }
    }

    static async fetchFromXref(idAccessRole: number): Promise<AccessAction[] | null> {
        if (!idAccessRole)
            return null;
        try {
            return DBO.CopyArray<AccessActionBase, AccessAction>(
                await DBConnectionFactory.prisma.accessAction.findMany({
                    where: {
                        AccessRoleAccessActionXref: {
                            some: { idAccessRole },
                        },
                    },
                }), AccessAction);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessAction.fetchFromXref', error);
            return null;
        }
    }
}
