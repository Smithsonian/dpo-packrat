/* eslint-disable camelcase */
import { ModelUVMapChannel as ModelUVMapChannelBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class ModelUVMapChannel extends DBO.DBObject<ModelUVMapChannelBase> implements ModelUVMapChannelBase {
    idModelUVMapChannel!: number;
    ChannelPosition!: number;
    ChannelWidth!: number;
    idModelUVMapFile!: number;
    idVUVMapType!: number;

    constructor(input: ModelUVMapChannelBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idModelUVMapFile, ChannelPosition, ChannelWidth, idVUVMapType } = this;
            ({ idModelUVMapChannel: this.idModelUVMapChannel, idModelUVMapFile: this.idModelUVMapFile,
                ChannelPosition: this.ChannelPosition, ChannelWidth: this.ChannelWidth, idVUVMapType: this.idVUVMapType } =
                await DBConnectionFactory.prisma.modelUVMapChannel.create({
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

    async update(): Promise<boolean> {
        try {
            const { idModelUVMapChannel, idModelUVMapFile, ChannelPosition, ChannelWidth, idVUVMapType } = this;
            return await DBConnectionFactory.prisma.modelUVMapChannel.update({
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
            return DBO.CopyObject<ModelUVMapChannelBase, ModelUVMapChannel>(
                await DBConnectionFactory.prisma.modelUVMapChannel.findOne({ where: { idModelUVMapChannel, }, }), ModelUVMapChannel);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelUVMapChannel.fetch', error);
            return null;
        }
    }

    static async fetchFromModelUVMapFile(idModelUVMapFile: number): Promise<ModelUVMapChannel[] | null> {
        if (!idModelUVMapFile)
            return null;
        try {
            return DBO.CopyArray<ModelUVMapChannelBase, ModelUVMapChannel>(
                await DBConnectionFactory.prisma.modelUVMapChannel.findMany({ where: { idModelUVMapFile } }), ModelUVMapChannel);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelUVMapChannel.fetchFromModelUVMapFile', error);
            return null;
        }
    }
}
