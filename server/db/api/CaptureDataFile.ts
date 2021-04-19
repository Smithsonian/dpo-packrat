/* eslint-disable camelcase */
import { CaptureDataFile as CaptureDataFileBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class CaptureDataFile extends DBC.DBObject<CaptureDataFileBase> implements CaptureDataFileBase {
    idCaptureDataFile!: number;
    CompressedMultipleFiles!: boolean;
    idAsset!: number;
    idCaptureData!: number;
    idVVariantType!: number | null;

    constructor(input: CaptureDataFileBase) {
        super(input);
    }

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
}

