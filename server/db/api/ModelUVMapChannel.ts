/* eslint-disable camelcase */
import { ModelUVMapChannel as ModelUVMapChannelBase, join } from '@prisma/client';
import { ModelUVMapFile } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class ModelUVMapChannel extends DBC.DBObject<ModelUVMapChannelBase> implements ModelUVMapChannelBase {
    idModelUVMapChannel!: number;
    ChannelPosition!: number;
    ChannelWidth!: number;
    idModelUVMapFile!: number;
    idVUVMapType!: number;

    constructor(input: ModelUVMapChannelBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idModelUVMapFile, ChannelPosition, ChannelWidth, idVUVMapType } = this;
            ({ idModelUVMapChannel: this.idModelUVMapChannel, idModelUVMapFile: this.idModelUVMapFile,
                ChannelPosition: this.ChannelPosition, ChannelWidth: this.ChannelWidth, idVUVMapType: this.idVUVMapType } =
                await DBC.DBConnection.prisma.modelUVMapChannel.create({
                    data: {
                        ModelUVMapFile:  { connect: { idModelUVMapFile }, },
                        ChannelPosition, ChannelWidth,
                        Vocabulary: { connect: { idVocabulary: idVUVMapType }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelUVMapChannel.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModelUVMapChannel, idModelUVMapFile, ChannelPosition, ChannelWidth, idVUVMapType } = this;
            return await DBC.DBConnection.prisma.modelUVMapChannel.update({
                where: { idModelUVMapChannel, },
                data: {
                    ModelUVMapFile:  { connect: { idModelUVMapFile }, },
                    ChannelPosition, ChannelWidth,
                    Vocabulary: { connect: { idVocabulary: idVUVMapType }, },
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelUVMapChannel.update', error);
            return false;
        }
    }

    static async fetch(idModelUVMapChannel: number): Promise<ModelUVMapChannel | null> {
        if (!idModelUVMapChannel)
            return null;
        try {
            return DBC.CopyObject<ModelUVMapChannelBase, ModelUVMapChannel>(
                await DBC.DBConnection.prisma.modelUVMapChannel.findOne({ where: { idModelUVMapChannel, }, }), ModelUVMapChannel);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelUVMapChannel.fetch', error);
            return null;
        }
    }

    static async fetchFromModelUVMapFile(idModelUVMapFile: number): Promise<ModelUVMapChannel[] | null> {
        if (!idModelUVMapFile)
            return null;
        try {
            return DBC.CopyArray<ModelUVMapChannelBase, ModelUVMapChannel>(
                await DBC.DBConnection.prisma.modelUVMapChannel.findMany({ where: { idModelUVMapFile } }), ModelUVMapChannel);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelUVMapChannel.fetchFromModelUVMapFile', error);
            return null;
        }
    }

    static async fetchFromModelUVMapFiles(modelUVMapFiles: ModelUVMapFile[]): Promise<ModelUVMapChannel[] | null> {
        if (modelUVMapFiles.length == 0)
            return null;
        try {
            const idModelUVMapFiles: number[] = [];
            for (const modelUVMapFile of modelUVMapFiles) idModelUVMapFiles.push(modelUVMapFile.idModelUVMapFile);

            return DBC.CopyArray<ModelUVMapChannelBase, ModelUVMapChannel>(
                await DBC.DBConnection.prisma.$queryRaw<ModelUVMapChannel[]>`
                SELECT DISTINCT *
                FROM ModelUVMapChannel
                WHERE idModelUVMapFile IN (${join(idModelUVMapFiles)})`,
                ModelUVMapChannel
            );
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelUVMapChannel.fetchFromModelUVMapFiles', error);
            return null;
        }
    }
}
