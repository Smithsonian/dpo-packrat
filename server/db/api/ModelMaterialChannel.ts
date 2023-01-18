/* eslint-disable camelcase */
import { ModelMaterialChannel as ModelMaterialChannelBase, Prisma } from '@prisma/client';
import { ModelMaterial } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

export class ModelMaterialChannel extends DBC.DBObject<ModelMaterialChannelBase> implements ModelMaterialChannelBase {
    idModelMaterialChannel!: number;
    idModelMaterial!: number;
    idVMaterialType!: number | null;
    MaterialTypeOther!: string | null;
    idModelMaterialUVMap!: number | null;
    UVMapEmbedded!: boolean | null;
    ChannelPosition!: number | null;
    ChannelWidth!: number | null;
    Scalar1!: number | null;
    Scalar2!: number | null;
    Scalar3!: number | null;
    Scalar4!: number | null;
    AdditionalAttributes!: string | null;

    public fetchTableName(): string { return 'ModelMaterialChannel'; }
    public fetchID(): number { return this.idModelMaterialChannel; }

    constructor(input: ModelMaterialChannelBase) {
        super(input);
    }

    static constructFromPrisma(modelMaterialChannelBase: ModelMaterialChannelBase): ModelMaterialChannel {
        return new ModelMaterialChannel({
            idModelMaterialChannel: modelMaterialChannelBase.idModelMaterialChannel,
            idModelMaterial: modelMaterialChannelBase.idModelMaterial,
            idVMaterialType: H.Helpers.safeNumber(modelMaterialChannelBase.idVMaterialType),
            MaterialTypeOther: modelMaterialChannelBase.MaterialTypeOther,
            idModelMaterialUVMap: H.Helpers.safeNumber(modelMaterialChannelBase.idModelMaterialUVMap),
            UVMapEmbedded: H.Helpers.safeBoolean(modelMaterialChannelBase.UVMapEmbedded),
            ChannelPosition: H.Helpers.safeNumber(modelMaterialChannelBase.ChannelPosition),
            ChannelWidth: H.Helpers.safeNumber(modelMaterialChannelBase.ChannelWidth),
            Scalar1: H.Helpers.safeNumber(modelMaterialChannelBase.Scalar1),
            Scalar2: H.Helpers.safeNumber(modelMaterialChannelBase.Scalar2),
            Scalar3: H.Helpers.safeNumber(modelMaterialChannelBase.Scalar3),
            Scalar4: H.Helpers.safeNumber(modelMaterialChannelBase.Scalar4),
            AdditionalAttributes: modelMaterialChannelBase.AdditionalAttributes,
        });
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idModelMaterial, idVMaterialType, MaterialTypeOther, idModelMaterialUVMap, UVMapEmbedded, ChannelPosition, ChannelWidth,
                Scalar1, Scalar2, Scalar3, Scalar4, AdditionalAttributes } = this;
            ({ idModelMaterialChannel: this.idModelMaterialChannel, idModelMaterial: this.idModelMaterial, idVMaterialType: this.idVMaterialType,
                MaterialTypeOther: this.MaterialTypeOther, idModelMaterialUVMap: this.idModelMaterialUVMap, UVMapEmbedded: this.UVMapEmbedded,
                ChannelPosition: this.ChannelPosition, ChannelWidth: this.ChannelWidth, Scalar1: this.Scalar1, Scalar2: this.Scalar2,
                Scalar3: this.Scalar3, Scalar4: this.Scalar4, AdditionalAttributes: this.AdditionalAttributes } =
                await DBC.DBConnection.prisma.modelMaterialChannel.create({
                    data: {
                        ModelMaterial:              { connect: { idModelMaterial }, },
                        Vocabulary:                 idVMaterialType ? { connect: { idVocabulary: idVMaterialType }, } : undefined,
                        MaterialTypeOther,
                        ModelMaterialUVMap:         idModelMaterialUVMap ? { connect: { idModelMaterialUVMap }, } : undefined,
                        UVMapEmbedded,
                        ChannelPosition,
                        ChannelWidth,
                        Scalar1,
                        Scalar2,
                        Scalar3,
                        Scalar4,
                        AdditionalAttributes,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('create', error);
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModelMaterialChannel, idModelMaterial, idVMaterialType, MaterialTypeOther, idModelMaterialUVMap, UVMapEmbedded, ChannelPosition, ChannelWidth,
                Scalar1, Scalar2, Scalar3, Scalar4, AdditionalAttributes } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.modelMaterialChannel.update({
                where: { idModelMaterialChannel, },
                data: {
                    ModelMaterial:              { connect: { idModelMaterial }, },
                    Vocabulary:                 idVMaterialType ? { connect: { idVocabulary: idVMaterialType }, } : { disconnect: true, },
                    MaterialTypeOther,
                    ModelMaterialUVMap:         idModelMaterialUVMap ? { connect: { idModelMaterialUVMap }, } : { disconnect: true, },
                    UVMapEmbedded,
                    ChannelPosition,
                    ChannelWidth,
                    Scalar1,
                    Scalar2,
                    Scalar3,
                    Scalar4,
                    AdditionalAttributes,
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
            const { idModelMaterialChannel } = this;
            return await DBC.DBConnection.prisma.modelMaterialChannel.delete({
                where: { idModelMaterialChannel, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelMaterialChannel.delete', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idModelMaterialChannel: number): Promise<ModelMaterialChannel | null> {
        if (!idModelMaterialChannel)
            return null;
        try {
            return DBC.CopyObject<ModelMaterialChannelBase, ModelMaterialChannel>(
                await DBC.DBConnection.prisma.modelMaterialChannel.findUnique({ where: { idModelMaterialChannel, }, }), ModelMaterialChannel);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelMaterialChannel.fetch', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.ModelMaterialChannel.fetchFromModelMaterial', LOG.LS.eDB, error);
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

            const modelMaterialChannelBaseList: ModelMaterialChannelBase[] | null =
            // return DBC.CopyArray<ModelMaterialChannelBase, ModelMaterialChannel>(
                await DBC.DBConnection.prisma.$queryRaw<ModelMaterialChannel[]>`
                SELECT DISTINCT *
                FROM ModelMaterialChannel
                WHERE idModelMaterial IN (${Prisma.join(idModelMaterials)})`; // , ModelMaterialChannel);

            const modelMaterialChannelList: ModelMaterialChannel[] = [];
            for (const modelMaterialChannelBase of modelMaterialChannelBaseList)
                modelMaterialChannelList.push(ModelMaterialChannel.constructFromPrisma(modelMaterialChannelBase));
            return modelMaterialChannelList;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelMaterialChannel.fetchFromModelMaterials', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromModelMaterialUVMap(idModelMaterialUVMap: number): Promise<ModelMaterialChannel[] | null> {
        if (!idModelMaterialUVMap)
            return null;
        try {
            return DBC.CopyArray<ModelMaterialChannelBase, ModelMaterialChannel>(
                await DBC.DBConnection.prisma.modelMaterialChannel.findMany({ where: { idModelMaterialUVMap } }), ModelMaterialChannel);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelMaterialChannel.fetchFromModelMaterialUVMap', LOG.LS.eDB, error);
            return null;
        }
    }
}
