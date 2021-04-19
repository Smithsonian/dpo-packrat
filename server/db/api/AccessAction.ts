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
            LOG.error('DBAPI.AccessAction.create', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.AccessAction.update', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idAccessAction: number): Promise<AccessAction | null> {
        if (!idAccessAction)
            return null;
        try {
            return DBC.CopyObject<AccessActionBase, AccessAction>(
                await DBC.DBConnection.prisma.accessAction.findUnique({ where: { idAccessAction, }, }), AccessAction);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.AccessAction.fetch', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.AccessAction.fetchFromXref', LOG.LS.eDB, error);
            return null;
        }
    }
}
