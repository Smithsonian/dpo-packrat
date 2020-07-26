/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ModelUVMapFile as ModelUVMapFileBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class ModelUVMapFile extends DBC.DBObject<ModelUVMapFileBase> implements ModelUVMapFileBase {
    idModelUVMapFile!: number;
    idAsset!: number;
    idModelGeometryFile!: number;
    UVMapEdgeLength!: number;

    constructor(input: ModelUVMapFileBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idModelGeometryFile, idAsset, UVMapEdgeLength } = this;
            ({ idModelUVMapFile: this.idModelUVMapFile, idModelGeometryFile: this.idModelGeometryFile,
                idAsset: this.idAsset, UVMapEdgeLength: this.UVMapEdgeLength } =
                await DBC.DBConnection.prisma.modelUVMapFile.create({
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

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModelUVMapFile, idModelGeometryFile, idAsset, UVMapEdgeLength } = this;
            return await DBC.DBConnection.prisma.modelUVMapFile.update({
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
            return DBC.CopyObject<ModelUVMapFileBase, ModelUVMapFile>(
                await DBC.DBConnection.prisma.modelUVMapFile.findOne({ where: { idModelUVMapFile, }, }), ModelUVMapFile);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelUVMapFile.fetch', error);
            return null;
        }
    }

    static async fetchFromModelGeometryFile(idModelGeometryFile: number): Promise<ModelUVMapFile[] | null> {
        if (!idModelGeometryFile)
            return null;
        try {
            return DBC.CopyArray<ModelUVMapFileBase, ModelUVMapFile>(
                await DBC.DBConnection.prisma.modelUVMapFile.findMany({ where: { idModelGeometryFile } }), ModelUVMapFile);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelUVMapFile.fetchFromModelGeometryFile', error);
            return null;
        }
    }
}
