/* eslint-disable camelcase */
import { ModelMaterial as ModelMaterialBase, ModelObject, Prisma } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class ModelMaterial extends DBC.DBObject<ModelMaterialBase> implements ModelMaterialBase {
    idModelMaterial!: number;
    Name!: string | null;

    public fetchTableName(): string { return 'ModelMaterial'; }
    public fetchID(): number { return this.idModelMaterial; }

    constructor(input: ModelMaterialBase) {
        super(input);
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name } = this;
            ({ idModelMaterial: this.idModelMaterial, Name: this.Name } =
                await DBC.DBConnection.prisma.modelMaterial.create({
                    data: {
                        Name,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelMaterial.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModelMaterial, Name } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.modelMaterial.update({
                where: { idModelMaterial, },
                data: {
                    Name,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelMaterial.update', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idModelMaterial: number): Promise<ModelMaterial | null> {
        if (!idModelMaterial)
            return null;
        try {
            return DBC.CopyObject<ModelMaterialBase, ModelMaterial>(
                await DBC.DBConnection.prisma.modelMaterial.findUnique({ where: { idModelMaterial, }, }), ModelMaterial);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelMaterial.fetch', LOG.LS.eDB, error);
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
                SELECT DISTINCT MM.*
                FROM ModelMaterial AS MM
                JOIN ModelObjectModelMaterialXref AS MMX ON (MM.idModelMaterial = MMX.idModelMaterial)
                WHERE MMX.idModelObject IN (${Prisma.join(idModelObjects)})`,
                ModelMaterial
            );
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelMaterial.fetchFromModelObjects', LOG.LS.eDB, error);
            return null;
        }
    }
}
