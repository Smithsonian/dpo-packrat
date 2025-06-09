/* eslint-disable camelcase */
import { AccessContext as AccessContextBase }from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class AccessContext extends DBC.DBObject<AccessContextBase> implements AccessContextBase {
    idAccessContext!: number;
    Global!: boolean;
    Authoritative!: boolean;
    CaptureData!: boolean;
    Model!: boolean;
    Scene!: boolean;
    IntermediaryFile!: boolean;

    constructor(input: AccessContextBase) {
        super(input);
    }

    public fetchTableName(): string { return 'AccessContext'; }
    public fetchID(): number { return this.idAccessContext; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Authoritative, CaptureData, Global, IntermediaryFile, Model, Scene } = this;
            ({ idAccessContext: this.idAccessContext, Authoritative: this.Authoritative, CaptureData: this.CaptureData,
                Global: this.Global, IntermediaryFile: this.IntermediaryFile, Model: this.Model, Scene: this.Scene } =
                await DBC.DBConnection.prisma.accessContext.create({
                    data: { Authoritative, CaptureData, Global, IntermediaryFile, Model, Scene, }
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.Access.Context');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAccessContext, Authoritative, CaptureData, Global, IntermediaryFile, Model, Scene } = this;
            return await DBC.DBConnection.prisma.accessContext.update({
                where: { idAccessContext, },
                data: { Authoritative, CaptureData, Global, IntermediaryFile, Model, Scene }
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.Access.Context');
            return false;
        }
    }

    static async fetch(idAccessContext: number): Promise<AccessContext | null> {
        if (!idAccessContext)
            return null;
        try {
            return DBC.CopyObject<AccessContextBase, AccessContext>(
                await DBC.DBConnection.prisma.accessContext.findUnique({ where: { idAccessContext, }, }), AccessContext);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ idAccessContext, ...this },'DB.Access.Context');
            return null;
        }
    }
}
