/* eslint-disable camelcase */
import { CaptureDataFile as CaptureDataFileBase } from '@prisma/client';
import { AssetVersion } from './AssetVersion';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

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
            LOG.error('DBAPI.CaptureDataFile.create', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.CaptureDataFile.update', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.CaptureDataFile.fetch', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.CaptureDataFile.fetchFromCaptureData', LOG.LS.eDB, error);
            return null;
        }
    }

    /** Returns map from asset filePath -> idVVariantType */
    static async fetchFolderVariantMapFromCaptureData(idCaptureData: number): Promise<Map<string, number> | null> {
        if (!idCaptureData)
            return null;
        // creates a unique map of AssetVersion.filePath and file.idVVariantType
        const folderVariantMap = new Map<string, number>();

        const CDFiles: CaptureDataFile[] | null = await CaptureDataFile.fetchFromCaptureData(idCaptureData); /* istanbul ignore next */
        if (!CDFiles) {
            LOG.error(`DBAPI.CaptureDataFile.fetchFolderVariantMapFromCaptureData failed to retrieve CaptureDataFiles from ${idCaptureData}`, LOG.LS.eDB);
            return null;
        }

        for (const CDFile of CDFiles) {
            const assetVersion: AssetVersion | null = await AssetVersion.fetchLatestFromAsset(CDFile.idAsset); /* istanbul ignore next */
            if (!assetVersion) {
                LOG.error(`DBAPI.CaptureDataFile.fetchFolderVariantMapFromCaptureData failed to fetch assetVersion from ${JSON.stringify(CDFile, H.Helpers.saferStringify)}`, LOG.LS.eDB);
                return null;
            }

            if (!folderVariantMap.has(assetVersion.FilePath) && CDFile.idVVariantType)
                folderVariantMap.set(assetVersion.FilePath, CDFile.idVVariantType);
        }
        return folderVariantMap;
    }
}

