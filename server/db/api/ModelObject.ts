/* eslint-disable camelcase */
import { ModelObject as ModelObjectBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class ModelObject extends DBC.DBObject<ModelObjectBase> implements ModelObjectBase {
    idModelObject!: number;
    idModel!: number;
    idModelMetrics!: number | null;

    private idModelMetricsOrig!: number | null;

    constructor(input: ModelObjectBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idModelMetricsOrig = this.idModelMetrics;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idModel, idModelMetrics } = this;
            ({ idModelObject: this.idModelObject, idModel: this.idModel, idModelMetrics: this.idModelMetrics } =
                await DBC.DBConnection.prisma.modelObject.create({
                    data: {
                        Model:              { connect: { idModel }, },
                        ModelMetrics:       idModelMetrics ? { connect: { idModelMetrics }, } : undefined,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelObject.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModelObject, idModel, idModelMetrics, idModelMetricsOrig } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.modelObject.update({
                where: { idModelObject, },
                data: {
                    Model:              { connect: { idModel }, },
                    ModelMetrics:       idModelMetrics ? { connect: { idModelMetrics }, } : idModelMetricsOrig ? { disconnect: true, } : undefined,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelObject.update', error);
            return false;
        }
    }

    static async fetch(idModelObject: number): Promise<ModelObject | null> {
        if (!idModelObject)
            return null;
        try {
            return DBC.CopyObject<ModelObjectBase, ModelObject>(
                await DBC.DBConnection.prisma.modelObject.findOne({ where: { idModelObject, }, }), ModelObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelObject.fetch', error);
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
            LOG.logger.error('DBAPI.ModelObject.fetchFromModel', error);
            return null;
        }
    }
}
