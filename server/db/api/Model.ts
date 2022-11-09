/* eslint-disable camelcase */
import { Model as ModelBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Model extends DBC.DBObject<ModelBase> implements ModelBase, SystemObjectBased {
    idModel!: number;
    Name!: string;
    DateCreated!: Date;
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
    AutomationTag!: string | null;
    CountTriangles!: number | null;
    Title!: string | null;

    constructor(input: ModelBase) {
        super(input);
    }

    public fetchTableName(): string { return 'Model'; }
    public fetchID(): number { return this.idModel; }
    public cloneData(model: Model): void {
        this.Name = model.Name;
        this.DateCreated = model.DateCreated;
        this.idVCreationMethod = model.idVCreationMethod;
        this.idVModality = model.idVModality;
        this.idVPurpose = model.idVPurpose;
        this.idVUnits = model.idVUnits;
        this.idVFileType = model.idVFileType;
        this.idAssetThumbnail = model.idAssetThumbnail;
        this.CountAnimations = model.CountAnimations;
        this.CountCameras = model.CountCameras;
        this.CountFaces = model.CountFaces;
        this.CountLights = model.CountLights;
        this.CountMaterials = model.CountMaterials;
        this.CountMeshes = model.CountMeshes;
        this.CountVertices = model.CountVertices;
        this.CountEmbeddedTextures = model.CountEmbeddedTextures;
        this.CountLinkedTextures = model.CountLinkedTextures;
        this.FileEncoding = model.FileEncoding;
        this.IsDracoCompressed = model.IsDracoCompressed;
        this.AutomationTag = model.AutomationTag;
        this.CountTriangles = model.CountTriangles;
        this.Title = model.Title;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, DateCreated, idVCreationMethod, idVModality, idVUnits, idVPurpose,
                idVFileType, idAssetThumbnail, CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials,
                CountMeshes, CountVertices, CountEmbeddedTextures, CountLinkedTextures, FileEncoding, IsDracoCompressed, AutomationTag, CountTriangles,
                Title } = this;
            ({ idModel: this.idModel, Name: this.Name, DateCreated: this.DateCreated, idVCreationMethod: this.idVCreationMethod,
                idVModality: this.idVModality, idVUnits: this.idVUnits,
                idVPurpose: this.idVPurpose, idVFileType: this.idVFileType, idAssetThumbnail: this.idAssetThumbnail,
                CountAnimations: this.CountAnimations, CountCameras: this.CountCameras, CountFaces: this.CountFaces,
                CountLights: this.CountLights, CountMaterials: this.CountMaterials, CountMeshes: this.CountMeshes,
                CountVertices: this.CountVertices, CountEmbeddedTextures: this.CountEmbeddedTextures, CountLinkedTextures: this.CountLinkedTextures,
                FileEncoding: this.FileEncoding, IsDracoCompressed: this.IsDracoCompressed, AutomationTag: this.AutomationTag, CountTriangles: this.CountTriangles,
                Title: this.Title } =
                await DBC.DBConnection.prisma.model.create({
                    data: {
                        Name,
                        DateCreated,
                        Vocabulary_Model_idVCreationMethodToVocabulary: idVCreationMethod ? { connect: { idVocabulary: idVCreationMethod }, } : undefined,
                        Vocabulary_Model_idVModalityToVocabulary:       idVModality ? { connect: { idVocabulary: idVModality }, } : undefined,
                        Vocabulary_Model_idVPurposeToVocabulary:        idVPurpose ? { connect: { idVocabulary: idVPurpose }, } : undefined,
                        Vocabulary_Model_idVUnitsToVocabulary:          idVUnits ? { connect: { idVocabulary: idVUnits }, } : undefined,
                        Vocabulary_Model_idVFileTypeToVocabulary:       idVFileType ? { connect: { idVocabulary: idVFileType }, } : undefined,
                        Asset:                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials, CountMeshes, CountVertices, CountEmbeddedTextures,
                        CountLinkedTextures, FileEncoding, IsDracoCompressed, AutomationTag, CountTriangles, Title,
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
            const { idModel, Name, DateCreated, idVCreationMethod, idVModality, idVUnits, idVPurpose,
                idVFileType, idAssetThumbnail, CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials, CountMeshes,
                CountVertices, CountEmbeddedTextures, CountLinkedTextures, FileEncoding, IsDracoCompressed, AutomationTag, CountTriangles,
                Title } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.model.update({
                where: { idModel, },
                data: {
                    Name,
                    DateCreated,
                    Vocabulary_Model_idVCreationMethodToVocabulary: idVCreationMethod ? { connect: { idVocabulary: idVCreationMethod }, } : { disconnect: true, },
                    Vocabulary_Model_idVModalityToVocabulary:       idVModality ? { connect: { idVocabulary: idVModality }, } : { disconnect: true, },
                    Vocabulary_Model_idVPurposeToVocabulary:        idVPurpose ? { connect: { idVocabulary: idVPurpose }, } : { disconnect: true, },
                    Vocabulary_Model_idVUnitsToVocabulary:          idVUnits ? { connect: { idVocabulary: idVUnits }, } : { disconnect: true, },
                    Vocabulary_Model_idVFileTypeToVocabulary:       idVFileType ? { connect: { idVocabulary: idVFileType }, } : { disconnect: true, },
                    Asset:                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : { disconnect: true, },
                    CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials, CountMeshes, CountVertices, CountEmbeddedTextures,
                    CountLinkedTextures, FileEncoding, IsDracoCompressed, AutomationTag, CountTriangles, Title,
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

    static async fetchByFileNameAndAssetType(FileName: string, idVAssetTypes: number[]): Promise<Model[] | null> {
        try {
            return DBC.CopyArray<ModelBase, Model>(
                await DBC.DBConnection.prisma.$queryRaw<Model[]>`
                SELECT DISTINCT M.*
                FROM Model AS M
                JOIN SystemObject AS SOM ON (M.idModel = SOM.idModel)
                JOIN Asset AS ASS ON (SOM.idSystemObject = ASS.idSystemObject)
                JOIN AssetVersion AS ASV ON (ASS.idAsset = ASV.idAsset)
                WHERE ASV.FileName = ${FileName}
                  AND ASS.idVAssetType IN (${Prisma.join(idVAssetTypes)})`, Model);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Model.fetchByFileNameAndAssetType', LOG.LS.eDB, error);
            return null;
        }
    }

    /** fetches models which are children of either the specified idModelParent or idSceneParent, and have matching AutomationTag values */
    static async fetchChildrenModels(idModelParent: number | null, idSceneParent: number | null, AutomationTag: string): Promise<Model[] | null> {
        try {
            return DBC.CopyArray<ModelBase, Model>(
                await DBC.DBConnection.prisma.$queryRaw<Model[]>`
                SELECT DISTINCT M.*
                FROM Model AS M
                JOIN SystemObject AS SOD ON (M.idModel = SOD.idModel)
                JOIN SystemObjectXref AS SOX ON (SOD.idSystemObject = SOX.idSystemObjectDerived)
                JOIN SystemObject AS SOM ON (SOX.idSystemObjectMaster = SOM.idSystemObject)
                WHERE (SOM.idModel = ${idModelParent ?? -1} OR SOM.idScene = ${idSceneParent ?? -1})
                  AND M.AutomationTag = ${AutomationTag}`, Model);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Model.fetchChildrenModels', LOG.LS.eDB, error);
            return null;
        }
    }

    /** fetches models which are children of the specified idSystemObjectIemParent
     * and have the specified asset version filename and is one of the specified idVAssetTypes Asset.idVAssetType */
    static async fetchItemChildrenModels(idSystemObjectItemParent: number, FileName: string, idVAssetTypes: number[]): Promise<Model[] | null> {
        try {
            return DBC.CopyArray<ModelBase, Model>(
                await DBC.DBConnection.prisma.$queryRaw<Model[]>`
                SELECT DISTINCT M.*
                FROM Model AS M
                JOIN SystemObject AS SOM ON (M.idModel = SOM.idModel)
                JOIN Asset AS ASS ON (SOM.idSystemObject = ASS.idSystemObject)
                JOIN AssetVersion AS ASV ON (ASS.idAsset = ASV.idAsset)
                JOIN SystemObjectXref AS SOX ON (SOM.idSystemObject = SOX.idSystemObjectDerived)
                WHERE SOX.idSystemObjectMaster = ${idSystemObjectItemParent}
                  AND ASV.FileName = ${FileName}
                  AND ASS.idVAssetType IN (${Prisma.join(idVAssetTypes)})`, Model);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Model.fetchItemChildrenModels', LOG.LS.eDB, error);
            return null;
        }
    }
}