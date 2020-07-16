/* eslint-disable camelcase */
import { ModelGeometryFile as ModelGeometryFileBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class ModelGeometryFile extends DBO.DBObject<ModelGeometryFileBase> implements ModelGeometryFileBase {
    idModelGeometryFile!: number;
    BoundingBoxP1X!: number | null;
    BoundingBoxP1Y!: number | null;
    BoundingBoxP1Z!: number | null;
    BoundingBoxP2X!: number | null;
    BoundingBoxP2Y!: number | null;
    BoundingBoxP2Z!: number | null;
    FaceCount!: number | null;
    HasNormals!: boolean | null;
    HasUVSpace!: boolean | null;
    HasVertexColor!: boolean | null;
    idAsset!: number;
    idModel!: number;
    idVModelFileType!: number;
    IsWatertight!: boolean | null;
    Metalness!: number | null;
    PointCount!: number | null;
    Roughness!: number | null;

    constructor(input: ModelGeometryFileBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idModel, idAsset, idVModelFileType, Roughness, Metalness, PointCount, FaceCount, IsWatertight, HasNormals, HasVertexColor, HasUVSpace,
                BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z } = this;
            ({ idModelGeometryFile: this.idModelGeometryFile, idModel: this.idModel, idAsset: this.idAsset,
                idVModelFileType: this.idVModelFileType, Roughness: this.Roughness, Metalness: this.Metalness,
                PointCount: this.PointCount, FaceCount: this.FaceCount, IsWatertight: this.IsWatertight,
                HasNormals: this.HasNormals, HasVertexColor: this.HasVertexColor, HasUVSpace: this.HasUVSpace,
                BoundingBoxP1X: this.BoundingBoxP1X, BoundingBoxP1Y: this.BoundingBoxP1Y, BoundingBoxP1Z: this.BoundingBoxP1Z,
                BoundingBoxP2X: this.BoundingBoxP2X, BoundingBoxP2Y: this.BoundingBoxP2Y, BoundingBoxP2Z: this.BoundingBoxP2Z } =
                await DBConnectionFactory.prisma.modelGeometryFile.create({
                    data: {
                        Model:          { connect: { idModel }, },
                        Asset:          { connect: { idAsset }, },
                        Vocabulary:     { connect: { idVocabulary: idVModelFileType }, },
                        Roughness, Metalness, PointCount, FaceCount, IsWatertight, HasNormals, HasVertexColor, HasUVSpace,
                        BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
                    },
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.ModelGeometryFile.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idModelGeometryFile, idModel, idAsset, idVModelFileType, Roughness, Metalness, PointCount, FaceCount, IsWatertight, HasNormals, HasVertexColor, HasUVSpace,
                BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z } = this;
            return await DBConnectionFactory.prisma.modelGeometryFile.update({
                where: { idModelGeometryFile, },
                data: {
                    Model:          { connect: { idModel }, },
                    Asset:          { connect: { idAsset }, },
                    Vocabulary:     { connect: { idVocabulary: idVModelFileType }, },
                    Roughness, Metalness, PointCount, FaceCount, IsWatertight, HasNormals, HasVertexColor, HasUVSpace,
                    BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.ModelGeometryFile.update', error);
            return false;
        }
    }

    static async fetch(idModelGeometryFile: number): Promise<ModelGeometryFile | null> {
        try {
            return DBO.CopyObject<ModelGeometryFileBase, ModelGeometryFile>(
                await DBConnectionFactory.prisma.modelGeometryFile.findOne({ where: { idModelGeometryFile, }, }), ModelGeometryFile);
        } catch (error) {
            LOG.logger.error('DBAPI.ModelGeometryFile.fetch', error);
            return null;
        }
    }

    static async fetchFromModel(idModel: number): Promise<ModelGeometryFile[] | null> {
        try {
            return DBO.CopyArray<ModelGeometryFileBase, ModelGeometryFile>(
                await DBConnectionFactory.prisma.modelGeometryFile.findMany({ where: { idModel } }), ModelGeometryFile);
        } catch (error) {
            LOG.logger.error('DBAPI.ModelGeometryFile.fetchFromModel', error);
            return null;
        }
    }
}
