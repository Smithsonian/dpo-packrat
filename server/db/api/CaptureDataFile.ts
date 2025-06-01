/* eslint-disable camelcase */
import { CaptureDataFile as CaptureDataFileBase } from '@prisma/client';
import { AssetVersion } from './AssetVersion';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class CaptureDataFile extends DBC.DBObject<CaptureDataFileBase> implements CaptureDataFileBase {
    idCaptureDataFile!: number;
    idCaptureData!: number;
    idAsset!: number;
    idVVariantType!: number | null;
    CompressedMultipleFiles!: boolean;

    constructor(input: CaptureDataFileBase) {
        super(input);
    }

    public fetchTableName(): string { return 'CaptureDataFile'; }
    public fetchID(): number { return this.idCaptureDataFile; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idCaptureData, idAsset, idVVariantType, CompressedMultipleFiles } = this;
            ({ idCaptureDataFile: this.idCaptureDataFile, idCaptureData: this.idCaptureData, idAsset: this.idAsset,
                idVVariantType: this.idVVariantType, CompressedMultipleFiles: this.CompressedMultipleFiles } =
                await DBC.DBConnection.prisma.captureDataFile.create({
                    data: {
                        CaptureData:    { connect: { idCaptureData }, },
                        Asset:          { connect: { idAsset }, },
                        Vocabulary:     idVVariantType ? { connect: { idVocabulary: idVVariantType }, } : undefined,
                        CompressedMultipleFiles
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.CaptureData.File');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idCaptureDataFile, idCaptureData, idAsset, idVVariantType, CompressedMultipleFiles } = this;
            return await DBC.DBConnection.prisma.captureDataFile.update({
                where: { idCaptureDataFile, },
                data: {
                    CaptureData:    { connect: { idCaptureData }, },
                    Asset:          { connect: { idAsset }, },
                    Vocabulary:     idVVariantType ? { connect: { idVocabulary: idVVariantType }, } : { disconnect: true, },
                    CompressedMultipleFiles
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.CaptureData.File');
            return false;
        }
    }

    static async fetch(idCaptureDataFile: number): Promise<CaptureDataFile | null> {
        if (!idCaptureDataFile)
            return null;
        try {
            return DBC.CopyObject<CaptureDataFileBase, CaptureDataFile>(
                await DBC.DBConnection.prisma.captureDataFile.findUnique({ where: { idCaptureDataFile, }, }), CaptureDataFile);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ idCaptureDataFile, ...this },'DB.CaptureData.File');
            return null;
        }
    }

    static async fetchFromCaptureData(idCaptureData: number): Promise<CaptureDataFile[] | null> {
        if (!idCaptureData)
            return null;
        try {
            return DBC.CopyArray<CaptureDataFileBase, CaptureDataFile>(
                await DBC.DBConnection.prisma.captureDataFile.findMany({ where: { idCaptureData } }), CaptureDataFile);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from CaptureData failed',H.Helpers.getErrorString(error),{ idCaptureData, ...this },'DB.CaptureData.File');
            return null;
        }
    }

    /** Returns map from asset filePath -> idVVariantType */
    static async fetchFolderVariantMapFromCaptureData(idCaptureData: number): Promise<Map<string, number | null> | null> {
        if (!idCaptureData)
            return null;
        // creates a unique map of AssetVersion.filePath and file.idVVariantType
        const folderVariantMap = new Map<string, number | null>();

        const CDFiles: CaptureDataFile[] | null = await CaptureDataFile.fetchFromCaptureData(idCaptureData); /* istanbul ignore next */
        if (!CDFiles) {
            RK.logError(RK.LogSection.eDB,'fetch folder variant from CaptureData failed',`failed to retrieve CaptureDataFiles from ${idCaptureData}`,{ ...this },'DB.CaptureData.File');
            return null;
        }

        for (const CDFile of CDFiles) {
            const assetVersion: AssetVersion | null = await AssetVersion.fetchLatestFromAsset(CDFile.idAsset); /* istanbul ignore next */
            if (!assetVersion) {
                RK.logError(RK.LogSection.eDB,'fetch folder variant from CaptureData failed','failed to fetch assetVersion from CaptureDataFile',{ idCaptureData, ...this },'DB.CaptureData.File');
                return null;
            }

            if (!folderVariantMap.has(assetVersion.FilePath))
                folderVariantMap.set(assetVersion.FilePath, CDFile.idVVariantType);
        }
        return folderVariantMap;
    }
}

