/* eslint-disable camelcase */
import { Model as ModelBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

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
    ModelUse!: string;

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
        this.IsDracoCompressed = H.Helpers.safeBoolean(model.IsDracoCompressed);
        this.AutomationTag = model.AutomationTag;
        this.CountTriangles = model.CountTriangles;
        this.Title = model.Title;
        this.ModelUse = model.ModelUse;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, DateCreated, idVCreationMethod, idVModality, idVUnits, idVPurpose, idVFileType,
                idAssetThumbnail, CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials,
                CountMeshes, CountVertices, CountEmbeddedTextures, CountLinkedTextures, FileEncoding, IsDracoCompressed,
                AutomationTag, CountTriangles, Title, ModelUse } = this;
            ({ idModel: this.idModel, Name: this.Name, DateCreated: this.DateCreated, idVCreationMethod: this.idVCreationMethod,
                idVModality: this.idVModality, idVUnits: this.idVUnits,
                idVPurpose: this.idVPurpose, idVFileType: this.idVFileType, idAssetThumbnail: this.idAssetThumbnail,
                CountAnimations: this.CountAnimations, CountCameras: this.CountCameras, CountFaces: this.CountFaces,
                CountLights: this.CountLights, CountMaterials: this.CountMaterials, CountMeshes: this.CountMeshes,
                CountVertices: this.CountVertices, CountEmbeddedTextures: this.CountEmbeddedTextures, CountLinkedTextures: this.CountLinkedTextures,
                FileEncoding: this.FileEncoding, IsDracoCompressed: this.IsDracoCompressed, AutomationTag: this.AutomationTag, CountTriangles: this.CountTriangles,
                Title: this.Title, ModelUse: this.ModelUse } =
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
                        CountLinkedTextures, FileEncoding,
                        IsDracoCompressed: H.Helpers.safeBoolean(IsDracoCompressed),
                        AutomationTag, CountTriangles, Title, ModelUse,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModel, Name, DateCreated, idVCreationMethod, idVModality, idVUnits, idVPurpose, idVFileType,
                idAssetThumbnail, CountAnimations, CountCameras, CountFaces, CountLights, CountMaterials,
                CountMeshes, CountVertices, CountEmbeddedTextures, CountLinkedTextures, FileEncoding, IsDracoCompressed,
                AutomationTag, CountTriangles, Title, ModelUse } = this;
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
                    CountLinkedTextures, FileEncoding,
                    IsDracoCompressed: H.Helpers.safeBoolean(IsDracoCompressed),
                    AutomationTag, CountTriangles, Title, ModelUse
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model');
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idModel } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idModel, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch SystemObject failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model');
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
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model');
            return null;
        }
    }

    static async fetchAll(): Promise<Model[] | null> {
        try {
            return DBC.CopyArray<ModelBase, Model>(
                await DBC.DBConnection.prisma.model.findMany(), Model);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch all failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model');
            return null;
        }
    }

    static async fetchFromXref(idScene: number): Promise<Model[] | null> {
        // get's the assets using the ModelSceneXref table, which includes derivative models
        if (!idScene)
            return null;
        try {
            return DBC.CopyArray<ModelBase, Model>(
                await DBC.DBConnection.prisma.model.findMany({ where: { ModelSceneXref: { some: { idScene }, }, }, }), Model);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from scene xref failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model');
            return null;
        }
    }

    static async fetchMasterFromScene(idScene: number): Promise<Model[] | null> {
        // get the master Model associated with a given Scene
        // TODO: get 'Master' model type id from VocabularyID
        const idvMasterModelType: number = 45;

        return DBC.CopyArray<ModelBase, Model>(
            await DBC.DBConnection.prisma.$queryRaw<Model[]>`
                SELECT mdl.* FROM Scene AS scn
                JOIN SystemObject AS scnSO ON scn.idScene = scnSO.idScene
                JOIN SystemObjectXref AS scnSOX ON scnSO.idSystemObject = scnSOX.idSystemObjectDerived
                JOIN SystemObject AS masterSO ON (scnSOX.idSystemObjectMaster = masterSO.idSystemObject AND masterSO.idModel IS NOT NULL)
                JOIN Model AS mdl ON (masterSO.idModel = mdl.idModel AND mdl.idVPurpose = ${idvMasterModelType})
                JOIN SystemObject AS mdlSO ON mdl.idModel = mdlSO.idModel
                WHERE scn.idScene = ${idScene};
            `,Model);
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
            RK.logError(RK.LogSection.eDB,'fetch derived from Items failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model');
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
            RK.logError(RK.LogSection.eDB,'fetch by filename and AssetType failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model');
            return null;
        }
    }

    static async fetchBySystemObject(idSystemObject: number): Promise<Model | null> {
        if (!idSystemObject)
            return null;
        try {
            const models: Model[] | null =  DBC.CopyArray<ModelBase, Model>(
                await DBC.DBConnection.prisma.$queryRaw<Model[]>`
                SELECT * FROM Model AS mdl
                JOIN SystemObject AS so ON (mdl.idModel = so.idModel)
                WHERE so.idSystemObject = ${idSystemObject};`, Model);

            // if we have models just return the first one, else null
            if(models)
                return models[0];

            return null;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch by SystemObject failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model');
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
            RK.logError(RK.LogSection.eDB,'fetch child Models failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model');
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
            RK.logError(RK.LogSection.eDB,'fetch Item child Models failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model');
            return null;
        }
    }
}