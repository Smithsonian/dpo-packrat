/* eslint-disable camelcase */
import { ModelObject as ModelObjectBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class ModelObject extends DBC.DBObject<ModelObjectBase> implements ModelObjectBase {
    idModelObject!: number;
    idModel!: number;
    BoundingBoxP1X!: number | null;
    BoundingBoxP1Y!: number | null;
    BoundingBoxP1Z!: number | null;
    BoundingBoxP2X!: number | null;
    BoundingBoxP2Y!: number | null;
    BoundingBoxP2Z!: number | null;
    CountVertices!: number | null;
    CountFaces!: number | null;
    CountColorChannels!: number | null;
    CountTextureCoordinateChannels!: number | null;
    HasBones!: boolean | null;
    HasFaceNormals!: boolean | null;
    HasTangents!: boolean | null;
    HasTextureCoordinates!: boolean | null;
    HasVertexNormals!: boolean | null;
    HasVertexColor!: boolean | null;
    IsTwoManifoldUnbounded!: boolean | null;
    IsTwoManifoldBounded!: boolean | null;
    IsWatertight!: boolean | null;
    SelfIntersecting!: boolean | null;

    constructor(input: ModelObjectBase) {
        super(input);
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idModel, BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z, CountVertices,
                CountFaces, CountColorChannels, CountTextureCoordinateChannels, HasBones, HasFaceNormals, HasTangents, HasTextureCoordinates,
                HasVertexNormals, HasVertexColor, IsTwoManifoldUnbounded, IsTwoManifoldBounded, IsWatertight, SelfIntersecting } = this;
            ({ idModelObject: this.idModelObject, idModel: this.idModel,
                BoundingBoxP1X: this.BoundingBoxP1X, BoundingBoxP1Y: this.BoundingBoxP1Y, BoundingBoxP1Z: this.BoundingBoxP1Z,
                BoundingBoxP2X: this.BoundingBoxP2X, BoundingBoxP2Y: this.BoundingBoxP2Y, BoundingBoxP2Z: this.BoundingBoxP2Z,
                CountVertices: this.CountVertices, CountFaces: this.CountFaces, CountColorChannels: this.CountColorChannels,
                CountTextureCoordinateChannels: this.CountTextureCoordinateChannels, HasBones: this.HasBones, HasFaceNormals: this.HasFaceNormals,
                HasTangents: this.HasTangents, HasTextureCoordinates: this.HasTextureCoordinates, HasVertexNormals: this.HasVertexNormals,
                HasVertexColor: this.HasVertexColor, IsTwoManifoldUnbounded: this.IsTwoManifoldUnbounded, IsTwoManifoldBounded: this.IsTwoManifoldBounded,
                IsWatertight: this.IsWatertight, SelfIntersecting: this.SelfIntersecting } =
                await DBC.DBConnection.prisma.modelObject.create({
                    data: {
                        Model:              { connect: { idModel }, },
                        BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
                        CountVertices, CountFaces, CountColorChannels, CountTextureCoordinateChannels, HasBones, HasFaceNormals,
                        HasTangents, HasTextureCoordinates, HasVertexNormals, HasVertexColor, IsTwoManifoldUnbounded,
                        IsTwoManifoldBounded, IsWatertight, SelfIntersecting
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelObject.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModelObject, idModel, BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y,
                BoundingBoxP2Z,CountVertices, CountFaces, CountColorChannels, CountTextureCoordinateChannels, HasBones, HasFaceNormals,
                HasTangents, HasTextureCoordinates, HasVertexNormals, HasVertexColor, IsTwoManifoldUnbounded, IsTwoManifoldBounded,
                IsWatertight, SelfIntersecting } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.modelObject.update({
                where: { idModelObject, },
                data: {
                    Model:              { connect: { idModel }, },
                    BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
                    CountVertices, CountFaces, CountColorChannels, CountTextureCoordinateChannels, HasBones, HasFaceNormals,
                    HasTangents, HasTextureCoordinates, HasVertexNormals, HasVertexColor, IsTwoManifoldUnbounded,
                    IsTwoManifoldBounded, IsWatertight, SelfIntersecting
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelObject.update', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idModelObject: number): Promise<ModelObject | null> {
        if (!idModelObject)
            return null;
        try {
            return DBC.CopyObject<ModelObjectBase, ModelObject>(
                await DBC.DBConnection.prisma.modelObject.findUnique({ where: { idModelObject, }, }), ModelObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelObject.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromModel(idModel: number): Promise<ModelObject[] | null> {
        if (!idModel)
            return null;
        try {
            return DBC.CopyArray<ModelObjectBase, ModelObject>(
                await DBC.DBConnection.prisma.modelObject.findMany({ where: { idModel } }), ModelObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelObject.fetchFromModel', LOG.LS.eDB, error);
            return null;
        }
    }
}
