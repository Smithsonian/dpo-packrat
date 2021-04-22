/* eslint-disable camelcase */
import { Model as ModelBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { Asset, AssetVersion, ModelObject, ModelObjectModelMaterialXref, ModelMaterial, ModelMaterialChannel, ModelMaterialUVMap, SystemObject, SystemObjectBased, Vocabulary } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';
import * as CACHE from '../../cache';

export class ModelAsset {
    Asset: Asset;
    AssetVersion: AssetVersion;
    AssetName: string;
    AssetType: string;

    constructor(asset: Asset, assetVersion: AssetVersion, isModel: boolean, channelList: string[] | null) {
        this.Asset = asset;
        this.AssetVersion = assetVersion;
        this.AssetName = asset.FileName;
        this.AssetType = (isModel) ? 'Model' : 'Texture Map' + (channelList ? ` ${channelList.sort().join(', ')}` : '');
    }

    static async fetch(assetVersion: AssetVersion): Promise<ModelAsset | null> {
        const asset: Asset | null = await Asset.fetch(assetVersion.idAsset); /* istanbul ignore next */
        if (!asset) {
            LOG.error(`ModelAsset.fetch(${JSON.stringify(assetVersion)}) failed`, LOG.LS.eDB);
            return null;
        }
        const uvMaps: ModelMaterialUVMap[] | null = await ModelMaterialUVMap.fetchFromAsset(assetVersion.idAsset);
        const isModel: boolean = (uvMaps === null || uvMaps.length === 0); // if we have no maps, then this asset is for the model/geometry
        const channelList: string[] = []; /* istanbul ignore else */
        if (uvMaps) {
            for (const uvMap of uvMaps) {
                const uvChannels: ModelMaterialChannel[] | null = await ModelMaterialChannel.fetchFromModelMaterialUVMap(uvMap.idModelMaterialUVMap); /* istanbul ignore else */
                if (uvChannels) {
                    for (const uvChannel of uvChannels) {
                        const VMaterialType: Vocabulary | undefined = uvChannel.idVMaterialType
                            ? await CACHE.VocabularyCache.vocabulary(uvChannel.idVMaterialType) : /* istanbul ignore next */ undefined;  /* istanbul ignore else */
                        if (VMaterialType)
                            channelList.push(VMaterialType.Term);
                        else if (uvChannel.MaterialTypeOther)
                            channelList.push(uvChannel.MaterialTypeOther);
                    }
                }
            }
        }

        return new ModelAsset(asset, assetVersion, isModel, channelList.length > 0 ? channelList : null);
    }
}

export class ModelConstellation {
    Model: Model;
    ModelObjects: ModelObject[] | null;
    ModelMaterials: ModelMaterial[] | null;
    ModelMaterialChannels: ModelMaterialChannel[] | null;
    ModelMaterialUVMaps: ModelMaterialUVMap[] | null;
    ModelObjectModelMaterialXref: ModelObjectModelMaterialXref[] | null;
    ModelAssets: ModelAsset[] | null;

    constructor(model: Model,
        modelObjects: ModelObject[] | null, modelMaterials: ModelMaterial[] | null,
        modelMaterialChannels: ModelMaterialChannel[] | null, modelMaterialUVMaps: ModelMaterialUVMap[] | null,
        modelObjectModelMaterialXref: ModelObjectModelMaterialXref[] | null, modelAsset: ModelAsset[] | null) {
        this.Model = model;
        this.ModelObjects = modelObjects;
        this.ModelMaterials = modelMaterials;
        this.ModelMaterialChannels = modelMaterialChannels;
        this.ModelMaterialUVMaps = modelMaterialUVMaps;
        this.ModelObjectModelMaterialXref = modelObjectModelMaterialXref;
        this.ModelAssets = modelAsset;
    }

    static async fetch(idModel: number): Promise<ModelConstellation | null> {
        const model: Model | null = await Model.fetch(idModel);
        if (!model) {
            LOG.error(`ModelConstellation.fetch() unable to compute model from ${idModel}`, LOG.LS.eDB);
            return null;
        }

        const modelObjects: ModelObject[] | null = await ModelObject.fetchFromModel(idModel);
        const modelMaterials: ModelMaterial[] | null = await ModelMaterial.fetchFromModelObjects(modelObjects || /* istanbul ignore next */ []);
        const modelMaterialChannels: ModelMaterialChannel[] | null = await ModelMaterialChannel.fetchFromModelMaterials(modelMaterials || []);
        const modelMaterialUVMaps: ModelMaterialUVMap[] | null = await ModelMaterialUVMap.fetchFromModel(idModel);
        const modelObjectModelMaterialXref: ModelObjectModelMaterialXref[] | null = await ModelObjectModelMaterialXref.fetchFromModelObjects(modelObjects || /* istanbul ignore next */ []);

        const modelAssets: ModelAsset[] = [];
        const SO: SystemObject | null = await model.fetchSystemObject();
        const assetVersions: AssetVersion[] | null = SO ? await AssetVersion.fetchFromSystemObject(SO.idSystemObject) : /* istanbul ignore next */ null;
        if (assetVersions) {
            for (const assetVersion of assetVersions) {
                const modelAsset: ModelAsset | null = await ModelAsset.fetch(assetVersion); /* istanbul ignore else */
                if (modelAsset)
                    modelAssets.push(modelAsset);
            }
        }

        return new ModelConstellation(model, modelObjects, modelMaterials, modelMaterialChannels,
            modelMaterialUVMaps, modelObjectModelMaterialXref, modelAssets.length > 0 ? modelAssets : null);
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
    CountAnimations!: number | null;
    CountCameras!: number | null;
    CountFaces!: number | null;
    CountLights!: number | null;
    CountMaterials!: number | null;
    CountMeshes!: number | null;
    CountVertices!: number | null;
    CountEmbeddedTextures!: number | null;
    CountLinkedTextures!: number | null;
    FileEncoding!: string | null;

    constructor(input: ModelBase) {
        super(input);
    }

    public fetchTableName(): string { return 'Model'; }
    public fetchID(): number { return this.idModel; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, DateCreated, Master, Authoritative, idVCreationMethod, idVModality, idVUnits, idVPurpose,
                idVFileType, idAssetThumbnail, CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials,
                CountMeshes, CountVertices, CountEmbeddedTextures, CountLinkedTextures, FileEncoding } = this;
            ({ idModel: this.idModel, Name: this.Name, DateCreated: this.DateCreated, idVCreationMethod: this.idVCreationMethod,
                Master: this.Master, Authoritative: this.Authoritative, idVModality: this.idVModality, idVUnits: this.idVUnits,
                idVPurpose: this.idVPurpose, idVFileType: this.idVFileType, idAssetThumbnail: this.idAssetThumbnail,
                CountAnimations: this.CountAnimations, CountCameras: this.CountCameras, CountFaces: this.CountFaces,
                CountLights: this.CountLights, CountMaterials: this.CountMaterials, CountMeshes: this.CountMeshes,
                CountVertices: this.CountVertices, CountEmbeddedTextures: this.CountEmbeddedTextures, CountLinkedTextures: this.CountLinkedTextures,
                FileEncoding: this.FileEncoding } =
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
                        CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials, CountMeshes, CountVertices, CountEmbeddedTextures, CountLinkedTextures, FileEncoding,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Model.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModel, Name, DateCreated, Master, Authoritative, idVCreationMethod, idVModality, idVUnits, idVPurpose,
                idVFileType, idAssetThumbnail, CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials, CountMeshes,
                CountVertices, CountEmbeddedTextures, CountLinkedTextures, FileEncoding } = this;
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
                    CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials, CountMeshes, CountVertices, CountEmbeddedTextures, CountLinkedTextures, FileEncoding,
                    Asset:                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : { disconnect: true, },
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Model.update', LOG.LS.eDB, error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idModel } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idModel, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.model.fetchSystemObject', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.Model.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAll(): Promise<Model[] | null> {
        try {
            return DBC.CopyArray<ModelBase, Model>(
                await DBC.DBConnection.prisma.model.findMany(), Model);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Model.fetchAll', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.fetchModelFromXref', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.Model.fetchDerivedFromItems', LOG.LS.eDB, error);
            return null;
        }
    }
}
