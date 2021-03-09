/* eslint-disable camelcase */
import { ModelMaterial as ModelMaterialBase, ModelObject, join } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class ModelMaterial extends DBC.DBObject<ModelMaterialBase> implements ModelMaterialBase {
    idModelMaterial!: number;
    idModelObject!: number;
    Name!: string | null;

    constructor(input: ModelMaterialBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idModelObject, Name } = this;
            ({ idModelMaterial: this.idModelMaterial, idModelObject: this.idModelObject, Name: this.Name } =
                await DBC.DBConnection.prisma.modelMaterial.create({
                    data: {
                        ModelObject: { connect: { idModelObject }, },
                        Name,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelMaterial.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModelMaterial, idModelObject, Name } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.modelMaterial.update({
                where: { idModelMaterial, },
                data: {
                    ModelObject: { connect: { idModelObject }, },
                    Name,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelMaterial.update', error);
            return false;
        }
    }

    static async fetch(idModelMaterial: number): Promise<ModelMaterial | null> {
        if (!idModelMaterial)
            return null;
        try {
            return DBC.CopyObject<ModelMaterialBase, ModelMaterial>(
                await DBC.DBConnection.prisma.modelMaterial.findOne({ where: { idModelMaterial, }, }), ModelMaterial);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelMaterial.fetch', error);
            return null;
        }
    }

    static async fetchFromModelObjects(modelObjects: ModelObject[]): Promise<ModelMaterial[] | null> {
        if (modelObjects.length == 0)
            return null;
        try {
            const idModelObjects: number[] = [];
            for (const modelObject of modelObjects)
                idModelObjects.push(modelObject.idModelObject);

            return DBC.CopyArray<ModelMaterialBase, ModelMaterial>(
                await DBC.DBConnection.prisma.$queryRaw<ModelMaterial[]>`
                SELECT DISTINCT *
                FROM ModelMaterial
                WHERE idModelObject IN (${join(idModelObjects)})`,
                ModelMaterial
            );
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelMaterial.fetchFromModelObjects', error);
            return null;
        }
    }
}