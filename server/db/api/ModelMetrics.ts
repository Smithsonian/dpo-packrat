/* eslint-disable camelcase, @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */
import { ModelMetrics as ModelMetricsBase, join } from '@prisma/client';
import { ModelObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class ModelMetrics extends DBC.DBObject<ModelMetricsBase> implements ModelMetricsBase {
    idModelMetrics!: number;
    BoundingBoxP1X!: number | null;
    BoundingBoxP1Y!: number | null;
    BoundingBoxP1Z!: number | null;
    BoundingBoxP2X!: number | null;
    BoundingBoxP2Y!: number | null;
    BoundingBoxP2Z!: number | null;
    CountPoint!: number | null;
    CountFace!: number | null;
    CountColorChannel!: number | null;
    CountTextureCoorinateChannel!: number | null;
    HasBones!: boolean | null;
    HasFaceNormals!: boolean | null;
    HasTangents!: boolean | null;
    HasTextureCoordinates!: boolean | null;
    HasVertexNormals!: boolean | null;
    HasVertexColor!: boolean | null;
    IsManifold!: boolean | null;
    IsWatertight!: boolean | null;

    constructor(input: ModelMetricsBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    // BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z, CountPoint, CountFace, CountColorChannel, CountTextureCoorinateChannel, HasBones, HasFaceNormals, HasTangents, HasTextureCoordinates, HasVertexNormals, HasVertexColor, IsManifold, IsWatertight
    protected async createWorker(): Promise<boolean> {
        try {
            const { BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z, CountPoint,
                CountFace, CountColorChannel, CountTextureCoorinateChannel, HasBones, HasFaceNormals, HasTangents, HasTextureCoordinates,
                HasVertexNormals, HasVertexColor, IsManifold, IsWatertight } = this;
            ({ idModelMetrics: this.idModelMetrics, BoundingBoxP1X: this.BoundingBoxP1X, BoundingBoxP1Y: this.BoundingBoxP1Y, BoundingBoxP1Z: this.BoundingBoxP1Z,
                BoundingBoxP2X: this.BoundingBoxP2X, BoundingBoxP2Y: this.BoundingBoxP2Y, BoundingBoxP2Z: this.BoundingBoxP2Z,
                CountPoint: this.CountPoint, CountFace: this.CountFace, CountColorChannel: this.CountColorChannel,
                CountTextureCoorinateChannel: this.CountTextureCoorinateChannel, HasBones: this.HasBones, HasFaceNormals: this.HasFaceNormals,
                HasTangents: this.HasTangents, HasTextureCoordinates: this.HasTextureCoordinates, HasVertexNormals: this.HasVertexNormals,
                HasVertexColor: this.HasVertexColor, IsManifold: this.IsManifold, IsWatertight: this.IsWatertight } =
                await DBC.DBConnection.prisma.modelMetrics.create({
                    data: { BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
                        CountPoint, CountFace, CountColorChannel, CountTextureCoorinateChannel, HasBones, HasFaceNormals,
                        HasTangents, HasTextureCoordinates, HasVertexNormals, HasVertexColor, IsManifold, IsWatertight
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelMetrics.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModelMetrics, BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
                CountPoint, CountFace, CountColorChannel, CountTextureCoorinateChannel, HasBones, HasFaceNormals, HasTangents,
                HasTextureCoordinates, HasVertexNormals, HasVertexColor, IsManifold, IsWatertight } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.modelMetrics.update({
                where: { idModelMetrics, },
                data: { BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
                    CountPoint, CountFace, CountColorChannel, CountTextureCoorinateChannel, HasBones, HasFaceNormals,
                    HasTangents, HasTextureCoordinates, HasVertexNormals, HasVertexColor, IsManifold, IsWatertight
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelMetrics.update', error);
            return false;
        }
    }

    static async fetch(idModelMetrics: number): Promise<ModelMetrics | null> {
        if (!idModelMetrics)
            return null;
        try {
            return DBC.CopyObject<ModelMetricsBase, ModelMetrics>(
                await DBC.DBConnection.prisma.modelMetrics.findOne({ where: { idModelMetrics, }, }), ModelMetrics);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelMetrics.fetch', error);
            return null;
        }
    }

    static safeNumber(value: any): number | null {
        if (value == null)
            return null;
        return parseInt(value);
    }

    static safeBoolean(value: any): boolean | null {
        if (value == null)
            return null;
        return value ? true : false;
    }

    static async fetchFromModelObjects(modelObjects: ModelObject[]): Promise<ModelMetrics[] | null> {
        if (modelObjects.length == 0)
            return null;
        try {
            const idModelObjects: number[] = [];
            for (const modelObject of modelObjects)
                idModelObjects.push(modelObject.idModelObject);

            const modelMetricsBaseList: ModelMetricsBase[] | null =
            // return DBC.CopyArray<ModelMetricsBase, ModelMetrics>(
                await DBC.DBConnection.prisma.$queryRaw<ModelMetrics[]>`
                SELECT DISTINCT *
                FROM ModelMetrics
                WHERE idModelMetrics IN
                (SELECT idModelMetrics FROM ModelObject WHERE idModelObject IN (${join(idModelObjects)}))`; // , ModelMetrics);

            const modelMetricsList: ModelMetrics[] = [];
            for (const modelMetricsBase of modelMetricsBaseList) {
                const modelMetrics = new ModelMetrics({
                    idModelMetrics: modelMetricsBase.idModelMetrics,
                    BoundingBoxP1X: ModelMetrics.safeNumber(modelMetricsBase.BoundingBoxP1X),
                    BoundingBoxP1Y: ModelMetrics.safeNumber(modelMetricsBase.BoundingBoxP1Y),
                    BoundingBoxP1Z: ModelMetrics.safeNumber(modelMetricsBase.BoundingBoxP1Z),
                    BoundingBoxP2X: ModelMetrics.safeNumber(modelMetricsBase.BoundingBoxP2X),
                    BoundingBoxP2Y: ModelMetrics.safeNumber(modelMetricsBase.BoundingBoxP2Y),
                    BoundingBoxP2Z: ModelMetrics.safeNumber(modelMetricsBase.BoundingBoxP2Z),
                    CountPoint: ModelMetrics.safeNumber(modelMetricsBase.CountPoint),
                    CountFace: ModelMetrics.safeNumber(modelMetricsBase.CountFace),
                    CountColorChannel: ModelMetrics.safeNumber(modelMetricsBase.CountColorChannel),
                    CountTextureCoorinateChannel: ModelMetrics.safeNumber(modelMetricsBase.CountTextureCoorinateChannel),
                    HasBones: ModelMetrics.safeBoolean(modelMetricsBase.HasBones),
                    HasFaceNormals: ModelMetrics.safeBoolean(modelMetricsBase.HasFaceNormals),
                    HasTangents: ModelMetrics.safeBoolean(modelMetricsBase.HasTangents),
                    HasTextureCoordinates: ModelMetrics.safeBoolean(modelMetricsBase.HasTextureCoordinates),
                    HasVertexNormals: ModelMetrics.safeBoolean(modelMetricsBase.HasVertexNormals),
                    HasVertexColor: ModelMetrics.safeBoolean(modelMetricsBase.HasVertexColor),
                    IsManifold: ModelMetrics.safeBoolean(modelMetricsBase.IsManifold),
                    IsWatertight: ModelMetrics.safeBoolean(modelMetricsBase.IsWatertight),
                });
                modelMetricsList.push(modelMetrics);
            }
            return modelMetricsList;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelMetrics.fetchFromModelObjects', error);
            return null;
        }
    }
}
