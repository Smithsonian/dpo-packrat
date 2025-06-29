/* eslint-disable camelcase */
import { ModelObjectModelMaterialXref as ModelObjectModelMaterialXrefBase, Prisma } from '@prisma/client';
import { ModelObject, ModelMaterial } from '..';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class ModelObjectModelMaterialXref extends DBC.DBObject<ModelObjectModelMaterialXrefBase> implements ModelObjectModelMaterialXrefBase {
    idModelObjectModelMaterialXref!: number;
    idModelObject!: number;
    idModelMaterial!: number;

    constructor(input: ModelObjectModelMaterialXrefBase) {
        super(input);
    }

    public fetchTableName(): string { return 'ModelObjectModelMaterialXref'; }
    public fetchID(): number { return this.idModelObjectModelMaterialXref; }

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
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.ModelObject.MaterialXref');
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
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.ModelObject.MaterialXref');
            return false;
        }
    }
    /** Don't call this directly; instead, let DBObject.delete() call this. Code needing to delete a record should call this.delete(); */
    protected async deleteWorker(): Promise<boolean> {
        try {
            const { idModelObjectModelMaterialXref } = this;
            return await DBC.DBConnection.prisma.modelObjectModelMaterialXref.delete({
                where: { idModelObjectModelMaterialXref, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'delete failed',H.Helpers.getErrorString(error),{ ...this },'DB.ModelObject.MaterialXref');
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
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.ModelObject.MaterialXref');
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
            RK.logError(RK.LogSection.eDB,'fetch from ModelObject failed',H.Helpers.getErrorString(error),{ ...this },'DB.ModelObject.MaterialXref');
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
            RK.logError(RK.LogSection.eDB,'fetch from ModelObjects failed',H.Helpers.getErrorString(error),{ ...this },'DB.ModelObject.MaterialXref');
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
            RK.logError(RK.LogSection.eDB,'fetch from ModelMaterial failed',H.Helpers.getErrorString(error),{ ...this },'DB.ModelObject.MaterialXref');
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
            RK.logError(RK.LogSection.eDB,'fetch from ModelMaterials failed',H.Helpers.getErrorString(error),{ ...this },'DB.ModelObject.MaterialXref');
            return null;
        }
    }
}
