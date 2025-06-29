/* eslint-disable camelcase */
import { Metadata as MetadataBase, Prisma } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class Metadata extends DBC.DBObject<MetadataBase> implements MetadataBase {
    idMetadata!: number;
    Name!: string;
    ValueShort!: string | null;
    ValueExtended!: string | null;
    idAssetVersionValue!: number | null;
    idUser!: number | null;
    idVMetadataSource!: number | null;
    idSystemObject!: number | null;
    idSystemObjectParent!: number | null;

    constructor(input: MetadataBase) {
        super(input);
    }

    public fetchTableName(): string { return 'Metadata'; }
    public fetchID(): number { return this.idMetadata; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, ValueShort, ValueExtended, idAssetVersionValue, idUser, idVMetadataSource, idSystemObject, idSystemObjectParent } = this;
            ({ idMetadata: this.idMetadata, Name: this.Name, ValueShort: this.ValueShort,
                ValueExtended: this.ValueExtended, idUser: this.idUser,
                idVMetadataSource: this.idVMetadataSource, idSystemObject: this.idSystemObject, idAssetVersionValue: this.idAssetVersionValue } =
                await DBC.DBConnection.prisma.metadata.create({
                    data: {
                        Name,
                        ValueShort:     ValueShort          ? ValueShort : undefined,
                        ValueExtended:  ValueExtended       ? ValueExtended : undefined,
                        AssetVersion:   idAssetVersionValue ? { connect: { idAssetVersion: idAssetVersionValue }, } : undefined,
                        User:           idUser              ? { connect: { idUser }, } : undefined,
                        Vocabulary:     idVMetadataSource   ? { connect: { idVocabulary: idVMetadataSource }, } : undefined,
                        SystemObject_Metadata_idSystemObjectToSystemObject:       idSystemObject          ? { connect: { idSystemObject }, } : undefined,
                        SystemObject_Metadata_idSystemObjectParentToSystemObject: idSystemObjectParent    ? { connect: { idSystemObject: idSystemObjectParent }, } : undefined,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.Metadata');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idMetadata, Name, ValueShort, ValueExtended, idAssetVersionValue, idUser, idVMetadataSource, idSystemObject, idSystemObjectParent } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.metadata.update({
                where: { idMetadata, },
                data: {
                    Name,
                    ValueShort:     ValueShort          ? ValueShort : undefined,
                    ValueExtended:  ValueExtended       ? ValueExtended : undefined,
                    AssetVersion:   idAssetVersionValue ? { connect: { idAssetVersion: idAssetVersionValue }, } : { disconnect: true, },
                    User:           idUser              ? { connect: { idUser }, } : { disconnect: true, },
                    Vocabulary:     idVMetadataSource   ? { connect: { idVocabulary: idVMetadataSource }, } : { disconnect: true, },
                    SystemObject_Metadata_idSystemObjectToSystemObject:         idSystemObject          ? { connect: { idSystemObject }, } : { disconnect: true, },
                    SystemObject_Metadata_idSystemObjectParentToSystemObject:   idSystemObjectParent    ? { connect: { idSystemObject: idSystemObjectParent }, } : { disconnect: true, },
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.Metadata');
            return false;
        }
    }
    /** Don't call this directly; instead, let DBObject.delete() call this. Code needing to delete a record should call this.delete(); */
    protected async deleteWorker(): Promise<boolean> {
        try {
            // LOG.info(`SystemObjectXref.deleteWorker ${JSON.stringify(this)}`, LOG.LS.eDB);
            const { idMetadata } = this;
            return await DBC.DBConnection.prisma.metadata.delete({
                where: { idMetadata, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'delete failed',H.Helpers.getErrorString(error),{ ...this },'DB.Metadata');
            return false;
        }
    }

    protected static async createManyWorker(data: Metadata[]): Promise<boolean> {
        try {
            const retValue: Prisma.BatchPayload = await DBC.DBConnection.prisma.metadata.createMany({ data });
            return retValue.count === data.length;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create many failed',H.Helpers.getErrorString(error),{ ...this },'DB.Metadata');
            return false;
        }
    }

    static async fetch(idMetadata: number): Promise<Metadata | null> {
        if (!idMetadata)
            return null;
        try {
            return DBC.CopyObject<MetadataBase, Metadata>(
                await DBC.DBConnection.prisma.metadata.findUnique({ where: { idMetadata, }, }), Metadata);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.Metadata');
            return null;
        }
    }

    static async fetchFromUser(idUser: number): Promise<Metadata[] | null> {
        if (!idUser)
            return null;
        try {
            return DBC.CopyArray<MetadataBase, Metadata>(
                await DBC.DBConnection.prisma.metadata.findMany({ where: { idUser } }), Metadata);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from User failed',H.Helpers.getErrorString(error),{ ...this },'DB.Metadata');
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<Metadata[] | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyArray<MetadataBase, Metadata>(
                await DBC.DBConnection.prisma.metadata.findMany({ where: { idSystemObject } }), Metadata);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from SystemObject failed',H.Helpers.getErrorString(error),{ ...this },'DB.Metadata');
            return null;
        }
    }

    static async fetchAllByPage(idMetadataLast: number, pageSize: number): Promise<Metadata[] | null> {
        try {
            const rawResult: MetadataBase[] = (idMetadataLast == 0)
                ? await DBC.DBConnection.prisma.metadata.findMany({
                    take: pageSize,
                    orderBy: { idMetadata: 'asc', },
                })
                : await DBC.DBConnection.prisma.metadata.findMany({
                    take: pageSize,
                    skip: 1,
                    cursor:  { idMetadata: idMetadataLast, },
                    orderBy: { idMetadata: 'asc', },
                });
            return DBC.CopyArray<MetadataBase, Metadata>(rawResult, Metadata);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch all by page failed',H.Helpers.getErrorString(error),{ ...this },'DB.Metadata');
            return null;
        }
    }
}
