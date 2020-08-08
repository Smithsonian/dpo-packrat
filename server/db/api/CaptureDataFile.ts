/* eslint-disable camelcase */
import { CaptureDataFile as CaptureDataFileBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class CaptureDataFile extends DBC.DBObject<CaptureDataFileBase> implements CaptureDataFileBase {
    idCaptureDataFile!: number;
    CompressedMultipleFiles!: boolean;
    idAsset!: number;
    idCaptureData!: number;
    idVVariantType!: number;

    constructor(input: CaptureDataFileBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idCaptureData, idAsset, idVVariantType, CompressedMultipleFiles } = this;
            ({ idCaptureDataFile: this.idCaptureDataFile, idCaptureData: this.idCaptureData, idAsset: this.idAsset,
                idVVariantType: this.idVVariantType, CompressedMultipleFiles: this.CompressedMultipleFiles } =
                await DBC.DBConnection.prisma.captureDataFile.create({
                    data: {
                        CaptureData:    { connect: { idCaptureData }, },
                        Asset:          { connect: { idAsset }, },
                        Vocabulary:     { connect: { idVocabulary: idVVariantType }, },
                        CompressedMultipleFiles
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataFile.create', error);
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
                    Vocabulary:     { connect: { idVocabulary: idVVariantType }, },
                    CompressedMultipleFiles
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataFile.update', error);
            return false;
        }
    }

    static async fetch(idCaptureDataFile: number): Promise<CaptureDataFile | null> {
        if (!idCaptureDataFile)
            return null;
        try {
            return DBC.CopyObject<CaptureDataFileBase, CaptureDataFile>(
                await DBC.DBConnection.prisma.captureDataFile.findOne({ where: { idCaptureDataFile, }, }), CaptureDataFile);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataFile.fetch', error);
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
            LOG.logger.error('DBAPI.CaptureDataFile.fetchFromCaptureData', error);
            return null;
        }
    }
}

