/* eslint-disable camelcase */
import { ModelUVMapFile as ModelUVMapFileBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class ModelUVMapFile extends DBO.DBObject<ModelUVMapFileBase> implements ModelUVMapFileBase {
    idModelUVMapFile!: number;
    idAsset!: number;
    idModelGeometryFile!: number;
    UVMapEdgeLength!: number;

    constructor(input: ModelUVMapFileBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idModelGeometryFile, idAsset, UVMapEdgeLength } = this;
            ({ idModelUVMapFile: this.idModelUVMapFile, idModelGeometryFile: this.idModelGeometryFile,
                idAsset: this.idAsset, UVMapEdgeLength: this.UVMapEdgeLength } =
                await DBConnectionFactory.prisma.modelUVMapFile.create({
                    data: {
                        ModelGeometryFile:  { connect: { idModelGeometryFile }, },
                        Asset:              { connect: { idAsset }, },
                        UVMapEdgeLength,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelUVMapFile.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idModelUVMapFile, idModelGeometryFile, idAsset, UVMapEdgeLength } = this;
            return await DBConnectionFactory.prisma.modelUVMapFile.update({
                where: { idModelUVMapFile, },
                data: {
                    ModelGeometryFile:  { connect: { idModelGeometryFile }, },
                    Asset:              { connect: { idAsset }, },
                    UVMapEdgeLength,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelUVMapFile.update', error);
            return false;
        }
    }

    static async fetch(idModelUVMapFile: number): Promise<ModelUVMapFile | null> {
        if (!idModelUVMapFile)
            return null;
        try {
            return DBO.CopyObject<ModelUVMapFileBase, ModelUVMapFile>(
                await DBConnectionFactory.prisma.modelUVMapFile.findOne({ where: { idModelUVMapFile, }, }), ModelUVMapFile);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelUVMapFile.fetch', error);
            return null;
        }
    }

    static async fetchFromModelGeometryFile(idModelGeometryFile: number): Promise<ModelUVMapFile[] | null> {
        if (!idModelGeometryFile)
            return null;
        try {
            return DBO.CopyArray<ModelUVMapFileBase, ModelUVMapFile>(
                await DBConnectionFactory.prisma.modelUVMapFile.findMany({ where: { idModelGeometryFile } }), ModelUVMapFile);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelUVMapFile.fetchFromModelGeometryFile', error);
            return null;
        }
    }
}
