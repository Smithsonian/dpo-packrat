/* eslint-disable camelcase */
import { Model as ModelBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Model extends DBC.DBObject<ModelBase> implements ModelBase, SystemObjectBased {
    idModel!: number;
    Name!: string;
    DateCreated!: Date;
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
            const { Name, DateCreated, Authoritative, idVCreationMethod, idVModality, idVUnits, idVPurpose,
                idVFileType, idAssetThumbnail, CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials,
                CountMeshes, CountVertices, CountEmbeddedTextures, CountLinkedTextures, FileEncoding } = this;
            ({ idModel: this.idModel, Name: this.Name, DateCreated: this.DateCreated, idVCreationMethod: this.idVCreationMethod,
                Authoritative: this.Authoritative, idVModality: this.idVModality, idVUnits: this.idVUnits,
                idVPurpose: this.idVPurpose, idVFileType: this.idVFileType, idAssetThumbnail: this.idAssetThumbnail,
                CountAnimations: this.CountAnimations, CountCameras: this.CountCameras, CountFaces: this.CountFaces,
                CountLights: this.CountLights, CountMaterials: this.CountMaterials, CountMeshes: this.CountMeshes,
                CountVertices: this.CountVertices, CountEmbeddedTextures: this.CountEmbeddedTextures, CountLinkedTextures: this.CountLinkedTextures,
                FileEncoding: this.FileEncoding } =
                await DBC.DBConnection.prisma.model.create({
                    data: {
                        Name,
                        DateCreated,
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
            const { idModel, Name, DateCreated, Authoritative, idVCreationMethod, idVModality, idVUnits, idVPurpose,
                idVFileType, idAssetThumbnail, CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials, CountMeshes,
                CountVertices, CountEmbeddedTextures, CountLinkedTextures, FileEncoding } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.model.update({
                where: { idModel, },
                data: {
                    Name,
                    DateCreated,
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

    static async fetchByFileNameSizeAndAssetType(FileName: string, StorageSize: BigInt, idVAssetTypes: number[]): Promise<Model[] | null> {
        try {
            return DBC.CopyArray<ModelBase, Model>(
                await DBC.DBConnection.prisma.$queryRaw<Model[]>`
                SELECT DISTINCT M.*
                FROM Model AS M
                JOIN SystemObject AS SOM ON (M.idModel = SOM.idModel)
                JOIN Asset AS ASS ON (SOM.idSystemObject = ASS.idSystemObject)
                JOIN AssetVersion AS ASV ON (ASS.idAsset = ASV.idAsset)
                WHERE ASV.FileName = ${FileName}
                  AND ASV.StorageSize = ${StorageSize}
                  AND ASS.idVAssetType IN (${Prisma.join(idVAssetTypes)})`, Model);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Model.fetchByFileNameSizeAndAssetType', LOG.LS.eDB, error);
            return null;
        }
    }
}
