/* eslint-disable camelcase */
import { CaptureData as CaptureDataBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class CaptureData extends DBC.DBObject<CaptureDataBase> implements CaptureDataBase, SystemObjectBased {
    idCaptureData!: number;
    Name!: string;
    idVCaptureMethod!: number;
    DateCaptured!: Date;
    Description!: string;
    idAssetThumbnail!: number | null;

    constructor(input: CaptureDataBase) {
        super(input);
    }

    public fetchTableName(): string { return 'CaptureData'; }
    public fetchID(): number { return this.idCaptureData; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, idVCaptureMethod, DateCaptured, Description, idAssetThumbnail } = this;
            ({ idCaptureData: this.idCaptureData, Name: this.Name, idVCaptureMethod: this.idVCaptureMethod,
                DateCaptured: this.DateCaptured, Description: this.Description, idAssetThumbnail: this.idAssetThumbnail } =
                await DBC.DBConnection.prisma.captureData.create({
                    data: {
                        Name,
                        Vocabulary:     { connect: { idVocabulary: idVCaptureMethod }, },
                        DateCaptured,
                        Description,
                        Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('create', error);
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idCaptureData, Name, idVCaptureMethod, DateCaptured, Description, idAssetThumbnail } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.captureData.update({
                where: { idCaptureData, },
                data: {
                    Name,
                    Vocabulary:     { connect: { idVocabulary: idVCaptureMethod }, },
                    DateCaptured,
                    Description,
                    Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : { disconnect: true, },
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('update', error);
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idCaptureData } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idCaptureData, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.CaptureData.fetchSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetch(idCaptureData: number): Promise<CaptureData | null> {
        if (!idCaptureData)
            return null;
        try {
            return DBC.CopyObject<CaptureDataBase, CaptureData>(
                await DBC.DBConnection.prisma.captureData.findUnique({ where: { idCaptureData, }, }), CaptureData);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.CaptureData.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAll(): Promise<CaptureData[] | null> {
        try {
            return DBC.CopyArray<CaptureDataBase, CaptureData>(
                await DBC.DBConnection.prisma.captureData.findMany(), CaptureData);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.CaptureData.fetchAll', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromCaptureDataPhoto(idCaptureDataPhoto: number): Promise<CaptureData | null> {
        if (!idCaptureDataPhoto)
            return null;
        try {
            const retValue: CaptureData[] | null = DBC.CopyArray<CaptureDataBase, CaptureData>(
                await DBC.DBConnection.prisma.captureData.findMany({ where: { CaptureDataPhoto: { some: { idCaptureDataPhoto, }, }, }, }), CaptureData);
            return (retValue && retValue.length > 0) ? retValue[0] : /* istanbul ignore next */ null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.CaptureData.fetchFromCaptureDataPhoto', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromXref(idCaptureDataGroup: number): Promise<CaptureData[] | null> {
        if (!idCaptureDataGroup)
            return null;
        try {
            return DBC.CopyArray<CaptureDataBase, CaptureData>(
                await DBC.DBConnection.prisma.captureData.findMany({
                    where: {
                        CaptureDataGroupCaptureDataXref: {
                            some: { idCaptureDataGroup },
                        },
                    },
                }), CaptureData);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.CaptureData.fetchFromXref', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of CaptureData that are connected to any of the specified items.
     * CaptureData are connected to system objects; we examine those system objects which are in a *derived* relationship
     * to system objects connected to any of the specified items.
     * @param idItem Array of Item.idItem
     */
    static async fetchDerivedFromItems(idItem: number[]): Promise<CaptureData[] | null> {
        if (!idItem || idItem.length == 0)
            return null;
        try {
            return DBC.CopyArray<CaptureDataBase, CaptureData>(
                await DBC.DBConnection.prisma.$queryRaw<CaptureData[]>`
                SELECT DISTINCT C.*
                FROM CaptureData AS C
                JOIN SystemObject AS SOC ON (C.idCaptureData = SOC.idCaptureData)
                JOIN SystemObjectXref AS SOX ON (SOC.idSystemObject = SOX.idSystemObjectDerived)
                JOIN SystemObject AS SOI ON (SOX.idSystemObjectMaster = SOI.idSystemObject)
                WHERE SOI.idItem IN (${Prisma.join(idItem)})`, CaptureData);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.CaptureData.fetchDerivedFromItems', LOG.LS.eDB, error);
            return null;
        }
    }
}
