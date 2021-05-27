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
    idVCreationMethod!: number | null;
    idVModality!: number | null;
    idVPurpose!: number | null;
    idVUnits!: number | null;
    idVFileType!: number | null;
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
    IsDracoCompressed!: boolean | null;

    constructor(input: ModelBase) {
        super(input);
    }

    public fetchTableName(): string { return 'Model'; }
    public fetchID(): number { return this.idModel; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, DateCreated, Authoritative, idVCreationMethod, idVModality, idVUnits, idVPurpose,
                idVFileType, idAssetThumbnail, CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials,
                CountMeshes, CountVertices, CountEmbeddedTextures, CountLinkedTextures, FileEncoding, IsDracoCompressed } = this;
            ({ idModel: this.idModel, Name: this.Name, DateCreated: this.DateCreated, idVCreationMethod: this.idVCreationMethod,
                Authoritative: this.Authoritative, idVModality: this.idVModality, idVUnits: this.idVUnits,
                idVPurpose: this.idVPurpose, idVFileType: this.idVFileType, idAssetThumbnail: this.idAssetThumbnail,
                CountAnimations: this.CountAnimations, CountCameras: this.CountCameras, CountFaces: this.CountFaces,
                CountLights: this.CountLights, CountMaterials: this.CountMaterials, CountMeshes: this.CountMeshes,
                CountVertices: this.CountVertices, CountEmbeddedTextures: this.CountEmbeddedTextures, CountLinkedTextures: this.CountLinkedTextures,
                FileEncoding: this.FileEncoding, IsDracoCompressed: this.IsDracoCompressed } =
                await DBC.DBConnection.prisma.model.create({
                    data: {
                        Name,
                        DateCreated,
                        Authoritative,
                        Vocabulary_Model_idVCreationMethodToVocabulary: idVCreationMethod ? { connect: { idVocabulary: idVCreationMethod }, } : undefined,
                        Vocabulary_Model_idVModalityToVocabulary:       idVModality ? { connect: { idVocabulary: idVModality }, } : undefined,
                        Vocabulary_Model_idVPurposeToVocabulary:        idVPurpose ? { connect: { idVocabulary: idVPurpose }, } : undefined,
                        Vocabulary_Model_idVUnitsToVocabulary:          idVUnits ? { connect: { idVocabulary: idVUnits }, } : undefined,
                        Vocabulary_Model_idVFileTypeToVocabulary:       idVFileType ? { connect: { idVocabulary: idVFileType }, } : undefined,
                        Asset:                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials, CountMeshes, CountVertices, CountEmbeddedTextures, CountLinkedTextures, FileEncoding, IsDracoCompressed,
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
                CountVertices, CountEmbeddedTextures, CountLinkedTextures, FileEncoding, IsDracoCompressed } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.model.update({
                where: { idModel, },
                data: {
                    Name,
                    DateCreated,
                    Authoritative,
                    Vocabulary_Model_idVCreationMethodToVocabulary: idVCreationMethod ? { connect: { idVocabulary: idVCreationMethod }, } : { disconnect: true, },
                    Vocabulary_Model_idVModalityToVocabulary:       idVModality ? { connect: { idVocabulary: idVModality }, } : { disconnect: true, },
                    Vocabulary_Model_idVPurposeToVocabulary:        idVPurpose ? { connect: { idVocabulary: idVPurpose }, } : { disconnect: true, },
                    Vocabulary_Model_idVUnitsToVocabulary:          idVUnits ? { connect: { idVocabulary: idVUnits }, } : { disconnect: true, },
                    Vocabulary_Model_idVFileTypeToVocabulary:       idVFileType ? { connect: { idVocabulary: idVFileType }, } : { disconnect: true, },
                    Asset:                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : { disconnect: true, },
                    CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials, CountMeshes, CountVertices, CountEmbeddedTextures, CountLinkedTextures, FileEncoding, IsDracoCompressed,
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
