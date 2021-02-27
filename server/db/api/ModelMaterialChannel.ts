/* eslint-disable camelcase */
import { ModelMaterialChannel as ModelMaterialChannelBase, join } from '@prisma/client';
import { ModelMaterial } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class ModelMaterialChannel extends DBC.DBObject<ModelMaterialChannelBase> implements ModelMaterialChannelBase {
    idModelMaterialChannel!: number;
    idModelMaterial!: number;
    idVMaterialType!: number | null;
    MaterialTypeOther!: string | null;
    idModelMaterialUVMap!: number | null;
    ChannelPosition!: number | null;
    ChannelWidth!: number | null;
    Scalar1!: number | null;
    Scalar2!: number | null;
    Scalar3!: number | null;
    Scalar4!: number | null;

    private idVMaterialTypeOrig!: number | null;
    private idModelMaterialUVMapOrig!: number | null;

    constructor(input: ModelMaterialChannelBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idVMaterialTypeOrig = this.idVMaterialType;
        this.idModelMaterialUVMapOrig = this.idModelMaterialUVMap;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idModelMaterial, idVMaterialType, MaterialTypeOther, idModelMaterialUVMap, ChannelPosition, ChannelWidth,
                Scalar1, Scalar2, Scalar3, Scalar4 } = this;
            ({ idModelMaterialChannel: this.idModelMaterialChannel, idModelMaterial: this.idModelMaterial, idVMaterialType: this.idVMaterialType,
                MaterialTypeOther: this.MaterialTypeOther, idModelMaterialUVMap: this.idModelMaterialUVMap, ChannelPosition: this.ChannelPosition,
                ChannelWidth: this.ChannelWidth, Scalar1: this.Scalar1, Scalar2: this.Scalar2, Scalar3: this.Scalar3, Scalar4: this.Scalar4 } =
                await DBC.DBConnection.prisma.modelMaterialChannel.create({
                    data: {
                        ModelMaterial:              { connect: { idModelMaterial }, },
                        Vocabulary:                 idVMaterialType ? { connect: { idVocabulary: idVMaterialType }, } : undefined,
                        MaterialTypeOther,
                        ModelMaterialUVMap:         idModelMaterialUVMap ? { connect: { idModelMaterialUVMap }, } : undefined,
                        ChannelPosition,
                        ChannelWidth,
                        Scalar1,
                        Scalar2,
                        Scalar3,
                        Scalar4,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelMaterialChannel.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModelMaterialChannel, idModelMaterial, idVMaterialType, MaterialTypeOther, idModelMaterialUVMap, ChannelPosition, ChannelWidth,
                Scalar1, Scalar2, Scalar3, Scalar4, idVMaterialTypeOrig, idModelMaterialUVMapOrig } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.modelMaterialChannel.update({
                where: { idModelMaterialChannel, },
                data: {
                    ModelMaterial:              { connect: { idModelMaterial }, },
                    Vocabulary:                 idVMaterialType ? { connect: { idVocabulary: idVMaterialType }, } : idVMaterialTypeOrig ? { disconnect: true, } : undefined,
                    MaterialTypeOther,
                    ModelMaterialUVMap:         idModelMaterialUVMap ? { connect: { idModelMaterialUVMap }, } : idModelMaterialUVMapOrig ? { disconnect: true, } : undefined,
                    ChannelPosition,
                    ChannelWidth,
                    Scalar1,
                    Scalar2,
                    Scalar3,
                    Scalar4,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelMaterialChannel.update', error);
            return false;
        }
    }

    static async fetch(idModelMaterialChannel: number): Promise<ModelMaterialChannel | null> {
        if (!idModelMaterialChannel)
            return null;
        try {
            return DBC.CopyObject<ModelMaterialChannelBase, ModelMaterialChannel>(
                await DBC.DBConnection.prisma.modelMaterialChannel.findOne({ where: { idModelMaterialChannel, }, }), ModelMaterialChannel);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelMaterialChannel.fetch', error);
            return null;
        }
    }

    static async fetchFromModelMaterial(idModelMaterial: number): Promise<ModelMaterialChannel[] | null> {
        if (!idModelMaterial)
            return null;
        try {
            return DBC.CopyArray<ModelMaterialChannelBase, ModelMaterialChannel>(
                await DBC.DBConnection.prisma.modelMaterialChannel.findMany({ where: { idModelMaterial } }), ModelMaterialChannel);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelMaterialChannel.fetchFromModelMaterial', error);
            return null;
        }
    }

    static async fetchFromModelMaterials(modelMaterials: ModelMaterial[]): Promise<ModelMaterialChannel[] | null> {
        if (modelMaterials.length == 0)
            return null;
        try {
            const idModelMaterials: number[] = [];
            for (const modelMaterial of modelMaterials)
                idModelMaterials.push(modelMaterial.idModelMaterial);

            return DBC.CopyArray<ModelMaterialChannelBase, ModelMaterialChannel>(
                await DBC.DBConnection.prisma.$queryRaw<ModelMaterialChannel[]>`
                SELECT DISTINCT *
                FROM ModelMaterialChannel
                WHERE idModelMaterial IN (${join(idModelMaterials)})`,
                ModelMaterialChannel
            );
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelMaterialChannel.fetchFromModelMaterials', error);
            return null;
        }
    }
}
