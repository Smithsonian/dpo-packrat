/* eslint-disable camelcase */
import { ModelSceneXref as ModelSceneXrefBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

export class ModelSceneXref extends DBC.DBObject<ModelSceneXrefBase> implements ModelSceneXrefBase {
    idModelSceneXref!: number;
    idModel!: number;
    idScene!: number;
    Name!: string | null;
    Usage!: string | null;
    Quality!: string | null;
    FileSize!: bigint | null;
    UVResolution!: number | null;
    BoundingBoxP1X!: number | null;
    BoundingBoxP1Y!: number | null;
    BoundingBoxP1Z!: number | null;
    BoundingBoxP2X!: number | null;
    BoundingBoxP2Y!: number | null;
    BoundingBoxP2Z!: number | null;
    TS0!: number | null;
    TS1!: number | null;
    TS2!: number | null;
    R0!: number | null;
    R1!: number | null;
    R2!: number | null;
    R3!: number | null;
    S0!: number | null;
    S1!: number | null;
    S2!: number | null;

    static NameMaxLen: number = 512;

    constructor(input: ModelSceneXrefBase) {
        super(input);
    }

    public fetchTableName(): string { return 'ModelSceneXref'; }
    public fetchID(): number { return this.idModelSceneXref; }
    public isTransformMatching(MSX: ModelSceneXref): boolean {
        return this.TS0 === MSX.TS0
            && this.TS1 === MSX.TS1
            && this.TS2 === MSX.TS2
            && this.R0 === MSX.R0
            && this.R1 === MSX.R1
            && this.R2 === MSX.R2
            && this.R3 === MSX.R3
            && this.S0 === MSX.S0
            && this.S1 === MSX.S1
            && this.S2 === MSX.S2;
    }
    /** return true if transform is updated */
    public updateIfNeeded(MSX: ModelSceneXref): { transformUpdated: boolean, updated: boolean } {
        let updated: boolean = false;
        let transformUpdated: boolean = false;
        const logContext: string = `${H.Helpers.JSONStringify(this)} vs incoming ${H.Helpers.JSONStringify(MSX)}`;

        if (this.Name                                   !== MSX.Name)                                   { this.Name             = MSX.Name;             updated = true; }
        if (this.Usage                                  !== MSX.Usage)                                  { this.Usage            = MSX.Usage;            updated = true; }
        if (this.Quality                                !== MSX.Quality)                                { this.Quality          = MSX.Quality;          updated = true; }
        if (this.FileSize                               !== MSX.FileSize)                               { this.FileSize         = MSX.FileSize;         updated = true; }
        if (this.UVResolution                           !== MSX.UVResolution)                           { this.UVResolution     = MSX.UVResolution;     updated = true; }
        if (H.Helpers.safeRound(this.BoundingBoxP1X)    !== H.Helpers.safeRound(MSX.BoundingBoxP1X))    { this.BoundingBoxP1X   = MSX.BoundingBoxP1X;   updated = true; }
        if (H.Helpers.safeRound(this.BoundingBoxP1Y)    !== H.Helpers.safeRound(MSX.BoundingBoxP1Y))    { this.BoundingBoxP1Y   = MSX.BoundingBoxP1Y;   updated = true; }
        if (H.Helpers.safeRound(this.BoundingBoxP1Z)    !== H.Helpers.safeRound(MSX.BoundingBoxP1Z))    { this.BoundingBoxP1Z   = MSX.BoundingBoxP1Z;   updated = true; }
        if (H.Helpers.safeRound(this.BoundingBoxP2X)    !== H.Helpers.safeRound(MSX.BoundingBoxP2X))    { this.BoundingBoxP2X   = MSX.BoundingBoxP2X;   updated = true; }
        if (H.Helpers.safeRound(this.BoundingBoxP2Y)    !== H.Helpers.safeRound(MSX.BoundingBoxP2Y))    { this.BoundingBoxP2Y   = MSX.BoundingBoxP2Y;   updated = true; }
        if (H.Helpers.safeRound(this.BoundingBoxP2Z)    !== H.Helpers.safeRound(MSX.BoundingBoxP2Z))    { this.BoundingBoxP2Z   = MSX.BoundingBoxP2Z;   updated = true; }

        if (H.Helpers.safeRound(this.TS0)               !== H.Helpers.safeRound(MSX.TS0))               { this.TS0 = MSX.TS0; transformUpdated = true; }
        if (H.Helpers.safeRound(this.TS1)               !== H.Helpers.safeRound(MSX.TS1))               { this.TS1 = MSX.TS1; transformUpdated = true; }
        if (H.Helpers.safeRound(this.TS2)               !== H.Helpers.safeRound(MSX.TS2))               { this.TS2 = MSX.TS2; transformUpdated = true; }
        if (H.Helpers.safeRound(this.R0)                !== H.Helpers.safeRound(MSX.R0))                { this.R0  = MSX.R0;  transformUpdated = true; }
        if (H.Helpers.safeRound(this.R1)                !== H.Helpers.safeRound(MSX.R1))                { this.R1  = MSX.R1;  transformUpdated = true; }
        if (H.Helpers.safeRound(this.R2)                !== H.Helpers.safeRound(MSX.R2))                { this.R2  = MSX.R2;  transformUpdated = true; }
        if (H.Helpers.safeRound(this.R3)                !== H.Helpers.safeRound(MSX.R3))                { this.R3  = MSX.R3;  transformUpdated = true; }
        if (H.Helpers.safeRound(this.S0)                !== H.Helpers.safeRound(MSX.S0))                { this.S0  = MSX.S0;  transformUpdated = true; }
        if (H.Helpers.safeRound(this.S1)                !== H.Helpers.safeRound(MSX.S1))                { this.S1  = MSX.S1;  transformUpdated = true; }
        if (H.Helpers.safeRound(this.S2)                !== H.Helpers.safeRound(MSX.S2))                { this.S2  = MSX.S2;  transformUpdated = true; }

        if (transformUpdated)
            updated = true;
        if (updated)
            LOG.info(`ModelSceneXref.updateTransformIfNeeded ${transformUpdated ? 'TRANSFORM UPDATED' : 'UPDATED'}: ${logContext}`, LOG.LS.eDB);
        return { transformUpdated, updated };
    }

    public computeModelAutomationTag(): string {
        // LOG.info(`>>> computeModelAutomationTag for ${this.Name} (${this.Usage}|${this.Quality}|${this.UVResolution})`,LOG.LS.eDEBUG);
        return `scene-${this.Usage}-${this.Quality}-${this.UVResolution}`;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idModel, idScene, Name, Usage, Quality, FileSize, UVResolution,
                BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
                TS0, TS1, TS2, R0, R1, R2, R3, S0, S1, S2 } = this;
            ({ idModelSceneXref: this.idModelSceneXref, idModel: this.idModel, idScene: this.idScene, Name: this.Name,
                Usage: this.Usage, Quality: this.Quality, FileSize: this.FileSize, UVResolution: this.UVResolution,
                BoundingBoxP1X: this.BoundingBoxP1X, BoundingBoxP1Y: this.BoundingBoxP1Y, BoundingBoxP1Z: this.BoundingBoxP1Z,
                BoundingBoxP2X: this.BoundingBoxP2X, BoundingBoxP2Y: this.BoundingBoxP2Y, BoundingBoxP2Z: this.BoundingBoxP2Z,
                TS0: this.TS0, TS1: this.TS1, TS2: this.TS2, R0: this.R0, R1: this.R1, R2: this.R2, R3: this.R3,
                S0: this.S0, S1: this.S1, S2: this.S2 } =
                await DBC.DBConnection.prisma.modelSceneXref.create({
                    data: {
                        Model:  { connect: { idModel }, },
                        Scene:  { connect: { idScene }, },
                        Name, Usage, Quality, FileSize, UVResolution,
                        BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
                        TS0, TS1, TS2, R0, R1, R2, R3, S0, S1, S2
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('create', error);
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModelSceneXref, idModel, idScene, Name, Usage, Quality, FileSize, UVResolution,
                BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
                TS0, TS1, TS2, R0, R1, R2, R3, S0, S1, S2 } = this;
            return await DBC.DBConnection.prisma.modelSceneXref.update({
                where: { idModelSceneXref, },
                data: {
                    Model:  { connect: { idModel }, },
                    Scene:  { connect: { idScene }, },
                    Name, Usage, Quality, FileSize, UVResolution,
                    BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
                    TS0, TS1, TS2, R0, R1, R2, R3, S0, S1, S2
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('update', error);
        }
    }
    /** Don't call this directly; instead, let DBObject.delete() call this. Code needing to delete a record should call this.delete(); */
    protected async deleteWorker(): Promise<boolean> {
        try {
            const { idModelSceneXref } = this;
            return await DBC.DBConnection.prisma.modelSceneXref.delete({
                where: { idModelSceneXref, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelSceneXref.delete', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idModelSceneXref: number): Promise<ModelSceneXref | null> {
        if (!idModelSceneXref)
            return null;
        try {
            return DBC.CopyObject<ModelSceneXrefBase, ModelSceneXref>(
                await DBC.DBConnection.prisma.modelSceneXref.findUnique({ where: { idModelSceneXref, }, }), ModelSceneXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelSceneXref.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromScene(idScene: number): Promise<ModelSceneXref[] | null> {
        if (!idScene)
            return null;
        try {
            return DBC.CopyArray<ModelSceneXrefBase, ModelSceneXref>(
                await DBC.DBConnection.prisma.modelSceneXref.findMany({ where: { idScene } }), ModelSceneXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelSceneXref.fetchFromScene', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromModel(idModel: number): Promise<ModelSceneXref[] | null> {
        if (!idModel)
            return null;
        try {
            return DBC.CopyArray<ModelSceneXrefBase, ModelSceneXref>(
                await DBC.DBConnection.prisma.modelSceneXref.findMany({ where: { idModel } }), ModelSceneXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelSceneXref.fetchFromModel', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromModelAndScene(idModel: number, idScene: number): Promise<ModelSceneXref[] | null> {
        if (!idModel || !idScene)
            return null;
        try {
            return DBC.CopyArray<ModelSceneXrefBase, ModelSceneXref>(
                await DBC.DBConnection.prisma.modelSceneXref.findMany({ where: { idModel, idScene } }), ModelSceneXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelSceneXref.fetchFromModelAndScene', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromModelSceneAndName(idModel: number, idScene: number, Name: string): Promise<ModelSceneXref[] | null> {
        if (!idModel || !idScene || !Name)
            return null;
        try {
            return DBC.CopyArray<ModelSceneXrefBase, ModelSceneXref>(
                await DBC.DBConnection.prisma.modelSceneXref.findMany({ where: { idModel, idScene, Name } }), ModelSceneXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelSceneXref.fetchFromModelSceneAndName', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromSceneNameUsageQualityUVResolution(idScene: number, Name: string | null,
        Usage: string | null, Quality: string | null, UVResolution: number | null): Promise<ModelSceneXref[] | null> {
        if (!idScene || !Name || !Usage || !Quality || !UVResolution)
            return null;
        try {
            return DBC.CopyArray<ModelSceneXrefBase, ModelSceneXref>(
                await DBC.DBConnection.prisma.modelSceneXref.findMany({ where: { idScene, Name, Usage, Quality, UVResolution } }), ModelSceneXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelSceneXref.fetchFromSceneNameUsageQualityUVResolution', LOG.LS.eDB, error);
            return null;
        }
    }
}

