/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ModelSceneXref as ModelSceneXrefBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class ModelSceneXref extends DBC.DBObject<ModelSceneXrefBase> implements ModelSceneXrefBase {
    idModelSceneXref!: number;
    idModel!: number;
    idScene!: number;
    R0!: number | null;
    R1!: number | null;
    R2!: number | null;
    R3!: number | null;
    TS0!: number | null;
    TS1!: number | null;
    TS2!: number | null;

    constructor(input: ModelSceneXrefBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idModel, idScene, TS0, TS1, TS2, R0, R1, R2, R3 } = this;
            ({ idModelSceneXref: this.idModelSceneXref, idModel: this.idModel, idScene: this.idScene, TS0: this.TS0,
                TS1: this.TS1, TS2: this.TS2, R0: this.R0, R1: this.R1, R2: this.R2, R3: this.R3 } =
                await DBC.DBConnectionFactory.prisma.modelSceneXref.create({
                    data: {
                        Model:  { connect: { idModel }, },
                        Scene:  { connect: { idScene }, },
                        TS0, TS1, TS2, R0, R1, R2, R3,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelSceneXref.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModelSceneXref, idModel, idScene, TS0, TS1, TS2, R0, R1, R2, R3 } = this;
            return await DBC.DBConnectionFactory.prisma.modelSceneXref.update({
                where: { idModelSceneXref, },
                data: {
                    Model:  { connect: { idModel }, },
                    Scene:  { connect: { idScene }, },
                    TS0, TS1, TS2, R0, R1, R2, R3,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelSceneXref.update', error);
            return false;
        }
    }

    static async fetch(idModelSceneXref: number): Promise<ModelSceneXref | null> {
        if (!idModelSceneXref)
            return null;
        try {
            return DBC.CopyObject<ModelSceneXrefBase, ModelSceneXref>(
                await DBC.DBConnectionFactory.prisma.modelSceneXref.findOne({ where: { idModelSceneXref, }, }), ModelSceneXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelSceneXref.fetch', error);
            return null;
        }
    }

    static async fetchFromScene(idScene: number): Promise<ModelSceneXref[] | null> {
        if (!idScene)
            return null;
        try {
            return DBC.CopyArray<ModelSceneXrefBase, ModelSceneXref>(
                await DBC.DBConnectionFactory.prisma.modelSceneXref.findMany({ where: { idScene } }), ModelSceneXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelSceneXref.fetchFromScene', error);
            return null;
        }
    }

    static async fetchFromModel(idModel: number): Promise<ModelSceneXref[] | null> {
        if (!idModel)
            return null;
        try {
            return DBC.CopyArray<ModelSceneXrefBase, ModelSceneXref>(
                await DBC.DBConnectionFactory.prisma.modelSceneXref.findMany({ where: { idModel } }), ModelSceneXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelSceneXref.fetchFromModel', error);
            return null;
        }
    }
}

