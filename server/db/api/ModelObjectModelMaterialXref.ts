/* eslint-disable camelcase */
import { ModelObjectModelMaterialXref as ModelObjectModelMaterialXrefBase, Prisma } from '@prisma/client';
import { ModelObject, ModelMaterial } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class ModelObjectModelMaterialXref extends DBC.DBObject<ModelObjectModelMaterialXrefBase> implements ModelObjectModelMaterialXrefBase {
    idModelObjectModelMaterialXref!: number;
    idModelObject!: number;
    idModelMaterial!: number;

    constructor(input: ModelObjectModelMaterialXrefBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idModelObject, idModelMaterial } = this;
            ({ idModelObjectModelMaterialXref: this.idModelObjectModelMaterialXref, idModelObject: this.idModelObject, idModelMaterial: this.idModelMaterial } =
                await DBC.DBConnection.prisma.modelObjectModelMaterialXref.create({
                    data: {
                        ModelObject:    { connect: { idModelObject }, },
                        ModelMaterial:  { connect: { idModelMaterial }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelObjectModelMaterialXref.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModelObjectModelMaterialXref, idModelObject, idModelMaterial } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.modelObjectModelMaterialXref.update({
                where: { idModelObjectModelMaterialXref, },
                data: {
                    ModelObject:    { connect: { idModelObject }, },
                    ModelMaterial:  { connect: { idModelMaterial }, },
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelObjectModelMaterialXref.update', error);
            return false;
        }
    }

    static async fetch(idModelObjectModelMaterialXref: number): Promise<ModelObjectModelMaterialXref | null> {
        if (!idModelObjectModelMaterialXref)
            return null;
        try {
            return DBC.CopyObject<ModelObjectModelMaterialXrefBase, ModelObjectModelMaterialXref>(
                await DBC.DBConnection.prisma.modelObjectModelMaterialXref.findUnique({ where: { idModelObjectModelMaterialXref, }, }), ModelObjectModelMaterialXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelObjectModelMaterialXref.fetch', error);
            return null;
        }
    }

    static async fetchFromModelObject(idModelObject: number): Promise<ModelObjectModelMaterialXref[] | null> {
        if (!idModelObject)
            return null;
        try {
            return DBC.CopyArray<ModelObjectModelMaterialXrefBase, ModelObjectModelMaterialXref>(
                await DBC.DBConnection.prisma.modelObjectModelMaterialXref.findMany({ where: { idModelObject } }), ModelObjectModelMaterialXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelObjectModelMaterialXref.fetchFromModelObject', error);
            return null;
        }
    }

    static async fetchFromModelObjects(modelObjects: ModelObject[]): Promise<ModelObjectModelMaterialXref[] | null> {
        if (modelObjects.length == 0)
            return null;
        try {
            const idModelObjects: number[] = [];
            for (const modelObject of modelObjects)
                idModelObjects.push(modelObject.idModelObject);

            return DBC.CopyArray<ModelObjectModelMaterialXrefBase, ModelObjectModelMaterialXref>(
                await DBC.DBConnection.prisma.$queryRaw<ModelObjectModelMaterialXref[]>`
                SELECT DISTINCT *
                FROM ModelObjectModelMaterialXref
                WHERE idModelObject IN (${Prisma.join(idModelObjects)})`, ModelObjectModelMaterialXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelObjectModelMaterialXref.fetchFromModelObjects', error);
            return null;
        }
    }

    static async fetchFromModelMaterial(idModelMaterial: number): Promise<ModelObjectModelMaterialXref[] | null> {
        if (!idModelMaterial)
            return null;
        try {
            return DBC.CopyArray<ModelObjectModelMaterialXrefBase, ModelObjectModelMaterialXref>(
                await DBC.DBConnection.prisma.modelObjectModelMaterialXref.findMany({ where: { idModelMaterial } }), ModelObjectModelMaterialXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelObjectModelMaterialXref.fetchFromModelMaterial', error);
            return null;
        }
    }

    static async fetchFromModelMaterials(modelMaterials: ModelMaterial[]): Promise<ModelObjectModelMaterialXref[] | null> {
        if (modelMaterials.length == 0)
            return null;
        try {
            const idModelMaterials: number[] = [];
            for (const modelMaterial of modelMaterials)
                idModelMaterials.push(modelMaterial.idModelMaterial);

            return DBC.CopyArray<ModelObjectModelMaterialXrefBase, ModelObjectModelMaterialXref>(
                await DBC.DBConnection.prisma.$queryRaw<ModelObjectModelMaterialXref[]>`
                SELECT DISTINCT *
                FROM ModelObjectModelMaterialXref
                WHERE idModelMaterial IN (${Prisma.join(idModelMaterials)})`, ModelObjectModelMaterialXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelObjectModelMaterialXref.fetchFromModelMaterials', error);
            return null;
        }
    }
}
