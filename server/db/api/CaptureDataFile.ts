/* eslint-disable camelcase */
import { CaptureDataFile as CaptureDataFileBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class CaptureDataFile extends DBO.DBObject<CaptureDataFileBase> implements CaptureDataFileBase {
    idCaptureDataFile!: number;
    CompressedMultipleFiles!: boolean;
    idAsset!: number;
    idCaptureData!: number;
    idVVariantType!: number;

    constructor(input: CaptureDataFileBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idCaptureData, idAsset, idVVariantType, CompressedMultipleFiles } = this;
            ({ idCaptureDataFile: this.idCaptureDataFile, idCaptureData: this.idCaptureData, idAsset: this.idAsset,
                idVVariantType: this.idVVariantType, CompressedMultipleFiles: this.CompressedMultipleFiles } =
                await DBConnectionFactory.prisma.captureDataFile.create({
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

    async update(): Promise<boolean> {
        try {
            const { idCaptureDataFile, idCaptureData, idAsset, idVVariantType, CompressedMultipleFiles } = this;
            return await DBConnectionFactory.prisma.captureDataFile.update({
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
            return DBO.CopyObject<CaptureDataFileBase, CaptureDataFile>(
                await DBConnectionFactory.prisma.captureDataFile.findOne({ where: { idCaptureDataFile, }, }), CaptureDataFile);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataFile.fetch', error);
            return null;
        }
    }

    static async fetchFromCaptureData(idCaptureData: number): Promise<CaptureDataFile[] | null> {
        if (!idCaptureData)
            return null;
        try {
            return DBO.CopyArray<CaptureDataFileBase, CaptureDataFile>(
                await DBConnectionFactory.prisma.captureDataFile.findMany({ where: { idCaptureData } }), CaptureDataFile);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataFile.fetchFromCaptureData', error);
            return null;
        }
    }
}

