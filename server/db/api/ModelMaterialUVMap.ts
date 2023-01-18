/* eslint-disable camelcase */
import { ModelMaterialUVMap as ModelMaterialUVMapBase, Prisma } from '@prisma/client';
import { Model } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class ModelMaterialUVMap extends DBC.DBObject<ModelMaterialUVMapBase> implements ModelMaterialUVMapBase {
    idModelMaterialUVMap!: number;
    idModel!: number;
    idAsset!: number;
    UVMapEdgeLength!: number;

    public fetchTableName(): string { return 'ModelMaterialUVMap'; }
    public fetchID(): number { return this.idModelMaterialUVMap; }

    constructor(input: ModelMaterialUVMapBase) {
        super(input);
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idModel, idAsset, UVMapEdgeLength } = this;
            ({ idModelMaterialUVMap: this.idModelMaterialUVMap, idModel: this.idModel, idAsset: this.idAsset, UVMapEdgeLength: this.UVMapEdgeLength } =
                await DBC.DBConnection.prisma.modelMaterialUVMap.create({
                    data: {
                        Model:              { connect: { idModel }, },
                        Asset:              { connect: { idAsset }, },
                        UVMapEdgeLength,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('create', error);
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModelMaterialUVMap, idModel, idAsset, UVMapEdgeLength } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.modelMaterialUVMap.update({
                where: { idModelMaterialUVMap, },
                data: {
                    Model:              { connect: { idModel }, },
                    Asset:              { connect: { idAsset }, },
                    UVMapEdgeLength,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('update', error);
        }
    }
    /** Don't call this directly; instead, let DBObject.delete() call this. Code needing to delete a record should call this.delete(); */
    protected async deleteWorker(): Promise<boolean> {
        try {
            const { idModelMaterialUVMap } = this;
            return await DBC.DBConnection.prisma.modelMaterialUVMap.delete({
                where: { idModelMaterialUVMap, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelMaterialUVMap.delete', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idModelMaterialUVMap: number): Promise<ModelMaterialUVMap | null> {
        if (!idModelMaterialUVMap)
            return null;
        try {
            return DBC.CopyObject<ModelMaterialUVMapBase, ModelMaterialUVMap>(
                await DBC.DBConnection.prisma.modelMaterialUVMap.findUnique({ where: { idModelMaterialUVMap, }, }), ModelMaterialUVMap);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelMaterialUVMap.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromAsset(idAsset: number): Promise<ModelMaterialUVMap[] | null> {
        if (!idAsset)
            return null;
        try {
            return DBC.CopyArray<ModelMaterialUVMapBase, ModelMaterialUVMap>(
                await DBC.DBConnection.prisma.modelMaterialUVMap.findMany({ where: { idAsset } }), ModelMaterialUVMap);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelMaterialUVMap.fetchFromAsset', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromModel(idModel: number): Promise<ModelMaterialUVMap[] | null> {
        if (!idModel)
            return null;
        try {
            return DBC.CopyArray<ModelMaterialUVMapBase, ModelMaterialUVMap>(
                await DBC.DBConnection.prisma.modelMaterialUVMap.findMany({ where: { idModel } }), ModelMaterialUVMap);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelMaterialUVMap.fetchFromModel', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromModels(models: Model[]): Promise<ModelMaterialUVMap[] | null> {
        if (models.length == 0)
            return null;
        try {
            const idModel: number[] = [];
            for (const model of models)
                idModel.push(model.idModel);

            return DBC.CopyArray<ModelMaterialUVMapBase, ModelMaterialUVMap>(
                await DBC.DBConnection.prisma.$queryRaw<ModelMaterialUVMap[]>`
                SELECT DISTINCT *
                FROM ModelMaterialUVMap
                WHERE idModel IN (${Prisma.join(idModel)})`,
                ModelMaterialUVMap
            );
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelMaterialUVMap.fetchFromModels', LOG.LS.eDB, error);
            return null;
        }
    }
}
