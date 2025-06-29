/* eslint-disable camelcase */
import { CaptureData as CaptureDataBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

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
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.CaptureData');
            return false;
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
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.CaptureData');
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idCaptureData } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idCaptureData, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch SystemObject failed',H.Helpers.getErrorString(error),{ ...this },'DB.CaptureData');
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
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ idCaptureData, ...this },'DB.CaptureData');
            return null;
        }
    }

    static async fetchAll(): Promise<CaptureData[] | null> {
        try {
            return DBC.CopyArray<CaptureDataBase, CaptureData>(
                await DBC.DBConnection.prisma.captureData.findMany(), CaptureData);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch all failed',H.Helpers.getErrorString(error),{ ...this },'DB.CaptureData');
            return null;
        }
    }

    static async fetchBySystemObject(idSystemObject: number): Promise<CaptureData | null> {
        if (!idSystemObject)
            return null;
        try {
            const captureData: CaptureData[] | null =  DBC.CopyArray<CaptureDataBase, CaptureData>(
                await DBC.DBConnection.prisma.$queryRaw<CaptureData[]>`
                SELECT * FROM CaptureData AS cd
                JOIN SystemObject AS so ON (cd.idCaptureData = so.idCaptureData)
                WHERE so.idSystemObject = ${idSystemObject};`, CaptureData);

            // if we have multiple capture data just return the first one, else null
            if(captureData)
                return captureData[0];

            return null;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch by SystemObject failed',H.Helpers.getErrorString(error),{ idSystemObject, ...this },'DB.CaptureData');
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
            RK.logError(RK.LogSection.eDB,'fetch from CaptureDataPhoto failed',H.Helpers.getErrorString(error),{ idCaptureDataPhoto, ...this },'DB.CaptureData');
            return null;
        }
    }
    static async fecthFromModel(idModel: number): Promise<CaptureData[] | null> {

        if (!idModel)
            return null;
        try {
            return DBC.CopyArray<CaptureDataBase, CaptureData>(
                await DBC.DBConnection.prisma.$queryRaw<CaptureData[]>`
                SELECT DISTINCT cd.*
                FROM Model AS m
                JOIN SystemObject AS mSO ON (mSO.idModel=m.idModel)
                JOIN SystemObjectXref AS mSOX ON (mSOX.idSystemObjectDerived=mSO.idSystemObject)
                JOIN SystemObject AS cdSO ON (cdSO.idSystemObject=mSOX.idSystemObjectMaster AND cdSO.idCaptureData IS NOT NULL)
                JOIN CaptureData AS cd ON (cd.idCaptureData=cdSO.idCaptureData)
                WHERE m.idModel=${idModel};`, CaptureData);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from Model failed',H.Helpers.getErrorString(error),{ idModel, ...this },'DB.CaptureData');
            return null;
        }

        return null;
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
            RK.logError(RK.LogSection.eDB,'fetch from xref failed',H.Helpers.getErrorString(error),{ idCaptureDataGroup, ...this },'DB.CaptureData');
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
            RK.logError(RK.LogSection.eDB,'fetch derived from Items failed',H.Helpers.getErrorString(error),{ idItem, ...this },'DB.CaptureData');
            return null;
        }
    }
}
