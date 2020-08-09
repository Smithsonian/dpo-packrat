/* eslint-disable camelcase */
import { CaptureData as CaptureDataBase, SystemObject as SystemObjectBase, join } from '@prisma/client';
import { SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class CaptureData extends DBC.DBObject<CaptureDataBase> implements CaptureDataBase {
    idCaptureData!: number;
    idVCaptureMethod!: number;
    DateCaptured!: Date;
    Description!: string;
    idAssetThumbnail!: number | null;

    private idAssetThumbnailOrig!: number | null;

    constructor(input: CaptureDataBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idAssetThumbnailOrig = this.idAssetThumbnail;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idVCaptureMethod, DateCaptured, Description, idAssetThumbnail } = this;
            ({ idCaptureData: this.idCaptureData, idVCaptureMethod: this.idVCaptureMethod,
                DateCaptured: this.DateCaptured, Description: this.Description, idAssetThumbnail: this.idAssetThumbnail } =
                await DBC.DBConnection.prisma.captureData.create({
                    data: {
                        Vocabulary:     { connect: { idVocabulary: idVCaptureMethod }, },
                        DateCaptured,
                        Description,
                        Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureData.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idCaptureData, idVCaptureMethod, DateCaptured, Description, idAssetThumbnail, idAssetThumbnailOrig } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.captureData.update({
                where: { idCaptureData, },
                data: {
                    Vocabulary:     { connect: { idVocabulary: idVCaptureMethod }, },
                    DateCaptured,
                    Description,
                    Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : idAssetThumbnailOrig ? { disconnect: true, } : undefined,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureData.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idCaptureData } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findOne({ where: { idCaptureData, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureData.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idCaptureData: number): Promise<CaptureData | null> {
        if (!idCaptureData)
            return null;
        try {
            return DBC.CopyObject<CaptureDataBase, CaptureData>(
                await DBC.DBConnection.prisma.captureData.findOne({ where: { idCaptureData, }, }), CaptureData);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureData.fetch', error);
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
            LOG.logger.error('DBAPI.CaptureData.fetchFromCaptureDataPhoto', error);
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
            LOG.logger.error('DBAPI.CaptureData.fetchFromXref', error);
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
                WHERE SOI.idItem IN (${join(idItem)})`, CaptureData);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureData.fetchDerivedFromItems', error);
            return null;
        }
    }
}
