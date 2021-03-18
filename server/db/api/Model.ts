/* eslint-disable camelcase */
import { Model as ModelBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { ModelObject, ModelMaterial, ModelMaterialChannel, ModelMaterialUVMap, ModelMetrics, SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class ModelConstellation {
    model: Model;
    modelObjects: ModelObject[] | null;
    modelMaterials: ModelMaterial[] | null;
    modelMaterialChannels: ModelMaterialChannel[] | null;
    modelMaterialUVMaps: ModelMaterialUVMap[] | null;
    modelMetric: ModelMetrics | null;
    modelObjectMetrics: ModelMetrics[] | null;

    constructor(model: Model,
        modelObjects: ModelObject[] | null, modelMaterials: ModelMaterial[] | null,
        modelMaterialChannels: ModelMaterialChannel[] | null, modelMaterialUVMaps: ModelMaterialUVMap[] | null,
        modelMetric: ModelMetrics | null, modelObjectMetrics: ModelMetrics[] | null) {
        this.model = model;
        this.modelObjects = modelObjects;
        this.modelMaterials = modelMaterials;
        this.modelMaterialChannels = modelMaterialChannels;
        this.modelMaterialUVMaps = modelMaterialUVMaps;
        this.modelMetric = modelMetric;
        this.modelObjectMetrics = modelObjectMetrics;
    }

    static async fetch(idModel: number): Promise<ModelConstellation | null> {
        const model: Model | null = await Model.fetch(idModel);
        if (!model) {
            LOG.logger.error(`ModelConstellation.fetch() unable to compute model from ${idModel}`);
            return null;
        }

        const modelObjects: ModelObject[] | null = await ModelObject.fetchFromModel(idModel);
        const modelMaterials: ModelMaterial[] | null = await ModelMaterial.fetchFromModelObjects(modelObjects || /* istanbul ignore next */ []);
        const modelMaterialChannels: ModelMaterialChannel[] | null = await ModelMaterialChannel.fetchFromModelMaterials(modelMaterials || []);
        const modelMaterialUVMaps: ModelMaterialUVMap[] | null = await ModelMaterialUVMap.fetchFromModel(idModel);
        const modelMetric: ModelMetrics | null = model.idModelMetrics ? await ModelMetrics.fetch(model.idModelMetrics) : null;
        const modelObjectMetrics: ModelMetrics[] | null = await ModelMetrics.fetchFromModelObjects(modelObjects || /* istanbul ignore next */ []);

        return new ModelConstellation(model, modelObjects, modelMaterials, modelMaterialChannels,
            modelMaterialUVMaps, modelMetric, modelObjectMetrics);
    }
}

export class Model extends DBC.DBObject<ModelBase> implements ModelBase, SystemObjectBased {
    idModel!: number;
    Name!: string;
    DateCreated!: Date;
    Master!: boolean;
    Authoritative!: boolean;
    idVCreationMethod!: number;
    idVModality!: number;
    idVPurpose!: number;
    idVUnits!: number;
    idVFileType!: number;
    idAssetThumbnail!: number | null;
    idModelMetrics!: number | null;

    private idAssetThumbnailOrig!: number | null;
    private idModelMetricsOrig!: number | null;

    constructor(input: ModelBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idAssetThumbnailOrig = this.idAssetThumbnail;
        this.idModelMetricsOrig = this.idModelMetrics;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, DateCreated, Master, Authoritative, idVCreationMethod, idVModality, idVUnits, idVPurpose,
                idVFileType, idAssetThumbnail, idModelMetrics } = this;
            ({ idModel: this.idModel, Name: this.Name, DateCreated: this.DateCreated, idVCreationMethod: this.idVCreationMethod,
                Master: this.Master, Authoritative: this.Authoritative, idVModality: this.idVModality,
                idVUnits: this.idVUnits, idVPurpose: this.idVPurpose, idVFileType: this.idVFileType,
                idAssetThumbnail: this.idAssetThumbnail, idModelMetrics: this.idModelMetrics } =
                await DBC.DBConnection.prisma.model.create({
                    data: {
                        Name,
                        DateCreated,
                        Master,
                        Authoritative,
                        Vocabulary_Model_idVCreationMethodToVocabulary: { connect: { idVocabulary: idVCreationMethod }, },
                        Vocabulary_Model_idVModalityToVocabulary:       { connect: { idVocabulary: idVModality }, },
                        Vocabulary_Model_idVPurposeToVocabulary:        { connect: { idVocabulary: idVPurpose }, },
                        Vocabulary_Model_idVUnitsToVocabulary:          { connect: { idVocabulary: idVUnits }, },
                        Vocabulary_Model_idVFileTypeToVocabulary:       { connect: { idVocabulary: idVFileType }, },
                        Asset:                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        ModelMetrics:                                   idModelMetrics ? { connect: { idModelMetrics }, } : undefined,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Model.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModel, Name, DateCreated, Master, Authoritative, idVCreationMethod, idVModality, idVUnits, idVPurpose,
                idVFileType, idAssetThumbnail, idModelMetrics, idAssetThumbnailOrig, idModelMetricsOrig } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.model.update({
                where: { idModel, },
                data: {
                    Name,
                    DateCreated,
                    Master,
                    Authoritative,
                    Vocabulary_Model_idVCreationMethodToVocabulary: { connect: { idVocabulary: idVCreationMethod }, },
                    Vocabulary_Model_idVModalityToVocabulary:       { connect: { idVocabulary: idVModality }, },
                    Vocabulary_Model_idVUnitsToVocabulary:          { connect: { idVocabulary: idVUnits }, },
                    Vocabulary_Model_idVPurposeToVocabulary:        { connect: { idVocabulary: idVPurpose }, },
                    Vocabulary_Model_idVFileTypeToVocabulary:       { connect: { idVocabulary: idVFileType }, },
                    Asset:                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : idAssetThumbnailOrig ? { disconnect: true, } : undefined,
                    ModelMetrics:                                   idModelMetrics ? { connect: { idModelMetrics }, } : idModelMetricsOrig ? { disconnect: true, } : undefined,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Model.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idModel } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idModel, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.model.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idModel: number): Promise<Model | null> {
        if (!idModel)
            return null;
        try {
            return DBC.CopyObject<ModelBase, Model>(
                await DBC.DBConnection.prisma.model.findUnique({ where: { idModel, }, }), Model);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Model.fetch', error);
            return null;
        }
    }

    static async fetchAll(): Promise<Model[] | null> {
        try {
            return DBC.CopyArray<ModelBase, Model>(
                await DBC.DBConnection.prisma.model.findMany(), Model);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Model.fetchAll', error);
            return null;
        }
    }

    static async fetchFromXref(idScene: number): Promise<Model[] | null> {
        if (!idScene)
            return null;
        try {
            return DBC.CopyArray<ModelBase, Model>(
                await DBC.DBConnection.prisma.model.findMany({ where: { ModelSceneXref: { some: { idScene }, }, }, }), Model);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.fetchModelFromXref', error);
            return null;
        }
    }

    /**
     * Computes the array of Models that are connected to any of the specified items.
     * Models are connected to system objects; we examine those system objects which are in a *derived* relationship
     * to system objects connected to any of the specified items.
     * @param idItem Array of Item.idItem
     */
    static async fetchDerivedFromItems(idItem: number[]): Promise<Model[] | null> {
        if (!idItem || idItem.length == 0)
            return null;
        try {
            return DBC.CopyArray<ModelBase, Model>(
                await DBC.DBConnection.prisma.$queryRaw<Model[]>`
                SELECT DISTINCT M.*
                FROM Model AS M
                JOIN SystemObject AS SOM ON (M.idModel = SOM.idModel)
                JOIN SystemObjectXref AS SOX ON (SOM.idSystemObject = SOX.idSystemObjectDerived)
                JOIN SystemObject AS SOI ON (SOX.idSystemObjectMaster = SOI.idSystemObject)
                WHERE SOI.idItem IN (${Prisma.join(idItem)})`, Model);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Model.fetchDerivedFromItems', error);
            return null;
        }
    }
}
