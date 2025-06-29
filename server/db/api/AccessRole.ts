/* eslint-disable camelcase */
import { AccessRole as AccessRoleBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class AccessRole extends DBC.DBObject<AccessRoleBase> implements AccessRoleBase {
    idAccessRole!: number;
    Name!: string;

    constructor(input: AccessRoleBase) {
        super(input);
    }

    public fetchTableName(): string { return 'AccessRole'; }
    public fetchID(): number { return this.idAccessRole; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name } = this;
            ({ idAccessRole: this.idAccessRole, Name: this.Name } = await DBC.DBConnection.prisma.accessRole.create({
                data: { Name, }
            }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.Access.Role');
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
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.Access.Role');
            return false;
        }
    }

    static async fetch(idAccessRole: number): Promise<AccessRole | null> {
        if (!idAccessRole)
            return null;
        try {
            return DBC.CopyObject<AccessRoleBase, AccessRole>(
                await DBC.DBConnection.prisma.accessRole.findUnique({ where: { idAccessRole, }, }), AccessRole);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ idAccessRole, ...this },'DB.Access.Role');
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
            RK.logError(RK.LogSection.eDB,'fetch from xref failed',H.Helpers.getErrorString(error),{ idAccessAction, ...this },'DB.Access.Role');
            return null;
        }
    }
}