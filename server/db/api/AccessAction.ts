/* eslint-disable camelcase */
import { AccessAction as AccessActionBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class AccessAction extends DBC.DBObject<AccessActionBase> implements AccessActionBase {
    idAccessAction!: number;
    Name!: string;
    SortOrder!: number;

    constructor(input: AccessActionBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, SortOrder } = this;
            ({ idAccessAction: this.idAccessAction, Name: this.Name, SortOrder: this.SortOrder } =
                await DBC.DBConnection.prisma.accessAction.create({
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

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAccessAction, Name, SortOrder } = this;
            return await DBC.DBConnection.prisma.accessAction.update({
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
            return DBC.CopyObject<AccessActionBase, AccessAction>(
                await DBC.DBConnection.prisma.accessAction.findOne({ where: { idAccessAction, }, }), AccessAction);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessAction.fetch', error);
            return null;
        }
    }

    static async fetchFromXref(idAccessRole: number): Promise<AccessAction[] | null> {
        if (!idAccessRole)
            return null;
        try {
            return DBC.CopyArray<AccessActionBase, AccessAction>(
                await DBC.DBConnection.prisma.accessAction.findMany({
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
