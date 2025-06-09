/* eslint-disable camelcase */
import { AccessContextObject as AccessContextObjectBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class AccessContextObject extends DBC.DBObject<AccessContextObjectBase> implements AccessContextObjectBase {
    idAccessContextObject!: number;
    idAccessContext!: number;
    idSystemObject!: number;

    constructor(input: AccessContextObjectBase) {
        super(input);
    }

    public fetchTableName(): string { return 'AccessContextObject'; }
    public fetchID(): number { return this.idAccessContextObject; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idAccessContext, idSystemObject } = this;
            ({ idAccessContextObject: this.idAccessContextObject, idAccessContext: this.idAccessContext,
                idSystemObject: this.idSystemObject } =
                await DBC.DBConnection.prisma.accessContextObject.create({
                    data: {
                        AccessContext: { connect: { idAccessContext }, },
                        SystemObject:  { connect: { idSystemObject }, },
                    }
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.Access.Context.Object');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAccessContextObject, idAccessContext, idSystemObject } = this;
            return await DBC.DBConnection.prisma.accessContextObject.update({
                where: { idAccessContextObject, },
                data: {
                    AccessContext: { connect: { idAccessContext }, },
                    SystemObject:  { connect: { idSystemObject }, },
                }
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.Access.Context.Object');
            return false;
        }
    }

    static async fetch(idAccessContextObject: number): Promise<AccessContextObject | null> {
        if (!idAccessContextObject)
            return null;
        try {
            return DBC.CopyObject<AccessContextObjectBase, AccessContextObject>(
                await DBC.DBConnection.prisma.accessContextObject.findUnique({ where: { idAccessContextObject, }, }), AccessContextObject);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ idAccessContextObject, ...this },'DB.Access.Context.Object');
            return null;
        }
    }

    static async fetchFromAccessContext(idAccessContext: number): Promise<AccessContextObject[] | null> {
        if (!idAccessContext)
            return null;
        try {
            return DBC.CopyArray<AccessContextObjectBase, AccessContextObject>(
                await DBC.DBConnection.prisma.accessContextObject.findMany({ where: { idAccessContext } }), AccessContextObject);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from AccessContext failed',H.Helpers.getErrorString(error),{ idAccessContext, ...this },'DB.Access.Context.Object');
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<AccessContextObject[] | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyArray<AccessContextObjectBase, AccessContextObject>(
                await DBC.DBConnection.prisma.accessContextObject.findMany({ where: { idSystemObject } }), AccessContextObject);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from SystemObject failed',H.Helpers.getErrorString(error),{ idSystemObject, ...this },'DB.Access.Context.Object');
            return null;
        }
    }
}
