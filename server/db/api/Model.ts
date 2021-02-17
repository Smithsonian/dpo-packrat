/* eslint-disable camelcase */
import { Model as ModelBase, SystemObject as SystemObjectBase, join } from '@prisma/client';
import { ModelGeometryFile, ModelUVMapFile, ModelUVMapChannel, SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class ModelConstellation {
    model: Model;
    modelGeometryFiles: ModelGeometryFile[] | null;
    modelUVMapFiles: ModelUVMapFile[] | null;
    modelUVMapChannels: ModelUVMapChannel[] | null;

    constructor(model: Model, modelGeometryFiles: ModelGeometryFile[] | null,
        modelUVMapFiles: ModelUVMapFile[] | null, modelUVMapChannels: ModelUVMapChannel[] | null) {
        this.model = model;
        this.modelGeometryFiles = modelGeometryFiles;
        this.modelUVMapFiles = modelUVMapFiles;
        this.modelUVMapChannels = modelUVMapChannels;
    }

    static async fetch(idModel: number): Promise<ModelConstellation | null> {
        const model: Model | null = await Model.fetch(idModel);
        if (!model) {
            LOG.logger.error(`ModelConstellation.fetch() unable to compute model from ${idModel}`);
            return null;
        }

        const modelGeometryFiles: ModelGeometryFile[] | null = await ModelGeometryFile.fetchFromModel(idModel);
        const modelUVMapFiles: ModelUVMapFile[] | null = modelGeometryFiles ? await ModelUVMapFile.fetchFromModelGeometryFiles(modelGeometryFiles) : /* istanbul ignore next */ null;
        const modelUVMapChannels: ModelUVMapChannel[] | null = modelUVMapFiles ? await ModelUVMapChannel.fetchFromModelUVMapFiles(modelUVMapFiles) : null;
        return new ModelConstellation(model, modelGeometryFiles, modelUVMapFiles, modelUVMapChannels);
    }
}

export class Model extends DBC.DBObject<ModelBase> implements ModelBase, SystemObjectBased {
    idModel!: number;
    Name!: string;
    Authoritative!: boolean;
    DateCreated!: Date;
    idAssetThumbnail!: number | null;
    idVCreationMethod!: number;
    idVModality!: number;
    idVPurpose!: number;
    idVUnits!: number;
    Master!: boolean;

    private idAssetThumbnailOrig!: number | null;

    constructor(input: ModelBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idAssetThumbnailOrig = this.idAssetThumbnail;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, DateCreated, idVCreationMethod, Master, Authoritative, idVModality, idVUnits, idVPurpose, idAssetThumbnail } = this;
            ({ idModel: this.idModel, Name: this.Name, DateCreated: this.DateCreated, idVCreationMethod: this.idVCreationMethod,
                Master: this.Master, Authoritative: this.Authoritative, idVModality: this.idVModality,
                idVUnits: this.idVUnits, idVPurpose: this.idVPurpose, idAssetThumbnail: this.idAssetThumbnail } =
                await DBC.DBConnection.prisma.model.create({
                    data: {
                        Name,
                        DateCreated,
                        Vocabulary_Model_idVCreationMethodToVocabulary: { connect: { idVocabulary: idVCreationMethod }, },
                        Master,
                        Authoritative,
                        Vocabulary_Model_idVModalityToVocabulary:       { connect: { idVocabulary: idVModality }, },
                        Vocabulary_Model_idVUnitsToVocabulary:          { connect: { idVocabulary: idVUnits }, },
                        Vocabulary_Model_idVPurposeToVocabulary:        { connect: { idVocabulary: idVPurpose }, },
                        Asset:                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
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
            const { idModel, Name, DateCreated, idVCreationMethod, Master, Authoritative, idVModality, idVUnits,
                idVPurpose, idAssetThumbnail, idAssetThumbnailOrig } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.model.update({
                where: { idModel, },
                data: {
                    Name,
                    DateCreated,
                    Vocabulary_Model_idVCreationMethodToVocabulary: { connect: { idVocabulary: idVCreationMethod }, },
                    Master,
                    Authoritative,
                    Vocabulary_Model_idVModalityToVocabulary:       { connect: { idVocabulary: idVModality }, },
                    Vocabulary_Model_idVUnitsToVocabulary:          { connect: { idVocabulary: idVUnits }, },
                    Vocabulary_Model_idVPurposeToVocabulary:        { connect: { idVocabulary: idVPurpose }, },
                    Asset:                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : idAssetThumbnailOrig ? { disconnect: true, } : undefined,
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
                await DBC.DBConnection.prisma.systemObject.findOne({ where: { idModel, }, }), SystemObject);
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
                await DBC.DBConnection.prisma.model.findOne({ where: { idModel, }, }), Model);
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
                WHERE SOI.idItem IN (${join(idItem)})`, Model);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Model.fetchDerivedFromItems', error);
            return null;
        }
    }
}
