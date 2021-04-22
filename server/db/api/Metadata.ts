/* eslint-disable camelcase */
import { Metadata as MetadataBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Metadata extends DBC.DBObject<MetadataBase> implements MetadataBase {
    idMetadata!: number;
    Name!: string;
    ValueShort!: string | null;
    ValueExtended!: string | null;
    idAssetValue!: number | null;
    idUser!: number | null;
    idVMetadataSource!: number | null;
    idSystemObject!: number | null;

    constructor(input: MetadataBase) {
        super(input);
    }

    public fetchTableName(): string { return 'Metadata'; }
    public fetchID(): number { return this.idMetadata; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, ValueShort, ValueExtended, idAssetValue, idUser, idVMetadataSource, idSystemObject } = this;
            ({ idMetadata: this.idMetadata, Name: this.Name, ValueShort: this.ValueShort,
                ValueExtended: this.ValueExtended, idAssetValue: this.idAssetValue, idUser: this.idUser,
                idVMetadataSource: this.idVMetadataSource, idSystemObject: this.idSystemObject } =
                await DBC.DBConnection.prisma.metadata.create({
                    data: {
                        Name,
                        ValueShort:     ValueShort          ? ValueShort : undefined,
                        ValueExtended:  ValueExtended       ? ValueExtended : undefined,
                        Asset:          idAssetValue        ? { connect: { idAsset: idAssetValue }, } : undefined,
                        User:           idUser              ? { connect: { idUser }, } : undefined,
                        Vocabulary:     idVMetadataSource   ? { connect: { idVocabulary: idVMetadataSource }, } : undefined,
                        SystemObject:   idSystemObject      ? { connect: { idSystemObject }, } : undefined,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Metadata.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idMetadata, Name, ValueShort, ValueExtended, idAssetValue, idUser, idVMetadataSource, idSystemObject } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.metadata.update({
                where: { idMetadata, },
                data: {
                    Name,
                    ValueShort:     ValueShort          ? ValueShort : undefined,
                    ValueExtended:  ValueExtended       ? ValueExtended : undefined,
                    Asset:          idAssetValue        ? { connect: { idAsset: idAssetValue }, } : { disconnect: true, },
                    User:           idUser              ? { connect: { idUser }, } : { disconnect: true, },
                    Vocabulary:     idVMetadataSource   ? { connect: { idVocabulary: idVMetadataSource }, } : { disconnect: true, },
                    SystemObject:   idSystemObject      ? { connect: { idSystemObject }, } : { disconnect: true, },
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Metadata.update', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.Metadata.fetch', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.Metadata.fetchFromUser', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.Metadata.fetchFromSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }
}
