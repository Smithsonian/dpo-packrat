/* eslint-disable camelcase */
import { ExternalSource as ExternalSourceBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class ExternalSource extends DBC.DBObject<ExternalSourceBase> implements ExternalSourceBase {
    idExternalSource!: number;
    ClientId!: string;
    Name!: string;
    ReferrerPattern!: string | null;
    idContact!: number | null;
    isActive!: boolean;
    DateCreated!: Date;

    constructor(input: ExternalSourceBase) {
        super(input);
    }

    public fetchTableName(): string { return 'ExternalSource'; }
    public fetchID(): number { return this.idExternalSource; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { ClientId, Name, ReferrerPattern, idContact, isActive } = this;
            ({
                idExternalSource: this.idExternalSource,
                ClientId: this.ClientId,
                Name: this.Name,
                ReferrerPattern: this.ReferrerPattern,
                idContact: this.idContact,
                isActive: this.isActive,
                DateCreated: this.DateCreated
            } = await DBC.DBConnection.prisma.externalSource.create({
                data: { ClientId, Name, ReferrerPattern, idContact, isActive },
            }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB, 'create failed', H.Helpers.getErrorString(error), undefined, 'DB.ExternalSource');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idExternalSource, ClientId, Name, ReferrerPattern, idContact, isActive } = this;
            return await DBC.DBConnection.prisma.externalSource.update({
                where: { idExternalSource, },
                data: { ClientId, Name, ReferrerPattern, idContact, isActive, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB, 'update failed', H.Helpers.getErrorString(error), undefined, 'DB.ExternalSource');
            return false;
        }
    }

    static async fetch(idExternalSource: number): Promise<ExternalSource | null> {
        if (!idExternalSource)
            return null;
        try {
            return DBC.CopyObject<ExternalSourceBase, ExternalSource>(
                await DBC.DBConnection.prisma.externalSource.findUnique({ where: { idExternalSource, }, }), ExternalSource);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB, 'fetch failed', H.Helpers.getErrorString(error),{ idExternalSource }, 'DB.ExternalSource');
            return null;
        }
    }

    static async fetchByClientId(ClientId: string): Promise<ExternalSource | null> {
        if (!ClientId)
            return null;
        try {
            return DBC.CopyObject<ExternalSourceBase, ExternalSource>(
                await DBC.DBConnection.prisma.externalSource.findUnique({ where: { ClientId, }, }), ExternalSource);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB, 'fetch by ClientId failed', H.Helpers.getErrorString(error),{ ClientId }, 'DB.ExternalSource');
            return null;
        }
    }

    static async fetchAll(): Promise<ExternalSource[] | null> {
        try {
            return DBC.CopyArray<ExternalSourceBase, ExternalSource>(
                await DBC.DBConnection.prisma.externalSource.findMany({ orderBy: { Name: 'asc' } }), ExternalSource);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB, 'fetch all failed', H.Helpers.getErrorString(error), undefined, 'DB.ExternalSource');
            return null;
        }
    }

    static async fetchActive(): Promise<ExternalSource[] | null> {
        try {
            return DBC.CopyArray<ExternalSourceBase, ExternalSource>(
                await DBC.DBConnection.prisma.externalSource.findMany({
                    where: { isActive: true },
                    orderBy: { Name: 'asc' }
                }), ExternalSource);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB, 'fetch active failed', H.Helpers.getErrorString(error), undefined, 'DB.ExternalSource');
            return null;
        }
    }
}
