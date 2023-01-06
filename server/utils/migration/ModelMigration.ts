/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../db';
import * as STORE from '../../storage/interface';
import * as CACHE from '../../cache';
import * as NAV from '../../navigation/interface';
import * as H from '../helpers';
import * as LOG from '../logger';
import { LineStream } from '../lineStream';
import { ModelMigrationFile } from './ModelMigrationFile';
import { WorkflowUtil } from '../../workflow/impl/Packrat/WorkflowUtil';
import { JobCookSIPackratInspectOutput, isEmbeddedTexture } from '../../job/impl/Cook';
import * as COMMON from '@dpo-packrat/common';

import { isArray } from 'lodash';
import { NodeIO, Document, Root, Buffer, Texture } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import tmp from 'tmp-promise';
import * as path from 'path';

interface IngestAssetResultSkippable extends STORE.IngestAssetResult {
    skipped?: boolean;
}

export type ModelMigrationResults = {
    success: boolean;
    error?: string | undefined;
    modelFileName?: string | undefined;
    modelFilePath?: string | undefined;
    model?: DBAPI.Model | null | undefined;
    asset?: DBAPI.Asset[] | null | undefined;
    assetVersion?: DBAPI.AssetVersion[] | null | undefined;
    filesMissing?: boolean | undefined;
    supportFiles?: string[];
};

export class ModelMigration {
    private uniqueID: string | undefined = undefined;
    private idSystemObjectItem: number | undefined;
    private masterModelFile: ModelMigrationFile | undefined = undefined;
    private masterModelGeometryFile: string | undefined = undefined;
    private masterModelLocation?: string;
    private modelFileSet: ModelMigrationFile[] = [];
    private extractMode?: boolean;

    // Computed
    private supportFiles: Set<string> = new Set<string>();
    private expectedSupportFiles: Set<string> = new Set<string>();

    private userOwner: DBAPI.User | undefined = undefined;
    private AssetModel: DBAPI.Asset[] | undefined = undefined;
    private AssetVersionModel: DBAPI.AssetVersion[] | undefined = undefined;
    private AssetVersionSupportFile: DBAPI.AssetVersion[] | undefined = undefined;
    private model: DBAPI.Model | undefined = undefined;

    private static vocabMaster: DBAPI.Vocabulary | undefined = undefined;
    private static vocabModelGeometryFile: DBAPI.Vocabulary | undefined = undefined;
    private static vocabModelUVMapFile: DBAPI.Vocabulary | undefined = undefined;
    private static vocabOtherFile: DBAPI.Vocabulary | undefined = undefined;
    private static regexMTLParser: RegExp = new RegExp('(map_.*?|norm|disp|decal|bump|refl)( .*?)? ([^ ]+)\\s*$', 'i'); // [1] map type, [2] map params, [3] map name
    private static idSystemObjectTest:  number | undefined = undefined;

    async migrateModel(modelFileSet: ModelMigrationFile[], idUser: number, doNotSendIngestionEvent?: boolean, extractMode?: boolean): Promise<ModelMigrationResults> {
        if (modelFileSet.length === 0)
            return this.returnStatus('migrateModel', false, 'called with empty file set');

        this.modelFileSet = modelFileSet;
        this.extractMode = extractMode;
        let res: ModelMigrationResults = await this.extractMigrationInfo();
        if (!res.success)
            return res;

        if (!this.uniqueID || !this.masterModelGeometryFile || !this.masterModelFile)
            return { success: false, error: 'No geometry present in model definition' };

        this.userOwner = await CACHE.UserCache.getUser(idUser);
        if (!this.userOwner)
            return this.returnStatus('migrateModel', false, `unable to load user with idUser of ${idUser}`);

        // Create DBAPI.Model
        res = await this.createModel(this.masterModelGeometryFile, this.masterModelFile.eVCreationMethod,
            this.masterModelFile.eVModality, this.masterModelFile.eVPurpose, this.masterModelFile.eVUnits);
        if (!res.success)
            return res;

        if (!this.model)
            return this.returnStatus('fetchAndExtractInfo', false, 'DB Model not created');

        // Ingest model geometry asset as a model
        res = await this.ingestModel(this.model, doNotSendIngestionEvent);
        if (!res.success)
            return res;

        if (!this.AssetVersionModel || this.AssetVersionModel.length === 0)
            return this.returnStatus('fetchAndExtractInfo', false, 'Model Asset not ingested');
        const AssetVersionModel: DBAPI.AssetVersion = this.AssetVersionModel[0];
        const AssetVersionModelSO: DBAPI.SystemObject | null = await AssetVersionModel.fetchSystemObject();
        if (!AssetVersionModelSO)
            return this.returnStatus('fetchAndExtractInfo', false, 'Model Asset System Object not found');

        // If file is .obj or .gltf, download model to crack open to detect .bin / .mtl files
        // Avoid using Cook for .obj (we'll crack it and its .mtl's manually to find textures)
        //    and for .ply, .stl (none of our master models in this format have textures)
        let useCook: boolean = true;
        const extension: string = path.extname(this.masterModelGeometryFile).toLowerCase();
        switch (extension) {
            case '.obj':    res = await this.crackOBJ(AssetVersionModel); useCook = false; break;
            case '.gltf':   res = await this.crackGLTF(AssetVersionModel, false); break;
            case '.glb':    res = await this.crackGLTF(AssetVersionModel, true); break;
            case '.ply':    useCook = false; break;
            case '.stl':    useCook = false; break;
        }   // Allow failures here, as some GLTFs are not being read properly by our 3rd party library

        // Ingest Explicit Support Files
        await this.ingestExplicitSupportFiles(); // Allow failures here, to get as many error messages as possible

        res = this.testSupportFiles();

        let AssetVersionSupportFileSO: DBAPI.SystemObject | null = null;
        const AssetVersionSupportFile: DBAPI.AssetVersion | null = (this.AssetVersionSupportFile) ? this.AssetVersionSupportFile[0] : null;
        if (AssetVersionSupportFile) {
            AssetVersionSupportFileSO = await AssetVersionSupportFile.fetchSystemObject();
            if (!AssetVersionSupportFileSO)
                return this.returnStatus('fetchAndExtractInfo', false, 'Support File Asset System Object not found');
        }

        if (useCook || !this.extractMode) { // if we're not in "extract mode", always use cook to gather model metrics
            // Run Cook's si-packrat-inspect and parse Cook output to obtain list of texture maps
            res = await WorkflowUtil.computeModelMetrics(this.masterModelGeometryFile, this.model.idModel, undefined,
                AssetVersionModelSO.idSystemObject, AssetVersionSupportFileSO?.idSystemObject,
                undefined, undefined, this.userOwner.idUser);
            if (res.success)
                res = await this.extractTextureMaps();
        }

        if (!res.success)
            return res;

        if (this.idSystemObjectItem)
            await this.postItemWiring();

        const modelFilePath: string | undefined = this.masterModelLocation ? path.dirname(this.masterModelLocation) : undefined;
        return { success: true, modelFileName: this.masterModelGeometryFile, modelFilePath, model: this.model,
            asset: this.AssetModel, assetVersion: this.AssetVersionModel, supportFiles: Array.from(this.supportFiles.keys()) };
    }

    private async extractMigrationInfo(): Promise<H.IOResults> {
        let retValue: boolean = true;
        let foundGeometry: boolean = false;

        let idSystemObjectItem: number | undefined = undefined;
        let testData: boolean | undefined = undefined;
        for (const modelFile of this.modelFileSet) {
            const fileExists: boolean = await this.testFileExistence(modelFile);
            if (!fileExists)
                return this.returnStatus('extractMigrationInfo', false, `unable to locate file for ${H.Helpers.JSONStringify(modelFile)}`, { filesMissing: true });

            if (modelFile.geometry) {
                const filePath: string = ModelMigrationFile.computeFilePath(modelFile);
                if (foundGeometry) {
                    this.logStatus('extractMigrationInfo', false, `Skipping Secondary Geometry File ${filePath} vs already encountered ${this.masterModelLocation}`);
                    retValue = false;
                    continue;
                }

                this.uniqueID                   = modelFile.uniqueID;
                this.idSystemObjectItem         = modelFile.idSystemObjectItem;

                this.masterModelFile            = modelFile;
                this.masterModelGeometryFile    = path.basename(filePath);
                this.masterModelLocation        = filePath;
                foundGeometry = true;
            } else
                this.expectedSupportFiles.add(modelFile.fileName);

            // capture idSystemObject for item, if any, and ensure consistency
            if (idSystemObjectItem === undefined)
                idSystemObjectItem = modelFile.idSystemObjectItem;
            else if (idSystemObjectItem !== modelFile.idSystemObjectItem && modelFile.idSystemObjectItem)
                return this.returnStatus('extractMigrationInfo', false, `called with inconsistent value for idSystemObjectItem (${modelFile.idSystemObjectItem}); expected ${idSystemObjectItem}`);

            // capture testData flag, if set, and ensure consistency
            if (modelFile.testData !== testData) {
                if (testData === undefined)
                    testData = modelFile.testData;
                else
                    return this.returnStatus('extractMigrationInfo', false, `called with inconsistent value for testData (${modelFile.testData}); expected ${testData}`);
            }
        }

        if (!this.idSystemObjectItem && testData) {
            await this.createTestObjects();
            this.idSystemObjectItem  = ModelMigration.idSystemObjectTest;
        }

        if (foundGeometry)
            return { success: retValue, error: retValue ? undefined : 'Multiple Geometry Found' };

        this.uniqueID = undefined;
        this.masterModelGeometryFile = undefined;
        return { success: true, error: 'No Geometry Found' };
    }

    private async ingestModel(SOBased: DBAPI.SystemObjectBased, doNotSendIngestionEvent?: boolean): Promise<H.IOResults> {
        const vAssetType: DBAPI.Vocabulary | undefined = await this.computeVocabModelGeometryFile();
        const idVAssetType: number | undefined = vAssetType?.idVocabulary;
        if (!idVAssetType)
            return this.returnStatus('ingestModel', false, 'Unable to compute idVAssetType for model geometry file');
        const ISI: STORE.IngestStreamOrFileInput = {
            readStream: null,
            localFilePath: this.masterModelLocation ?? this.masterModelGeometryFile ?? '',
            asset: null,
            FileName: this.masterModelGeometryFile ?? '',
            FilePath: '',
            idAssetGroup: 0,
            idVAssetType,
            allowZipCracking: true,
            idUserCreator: this.userOwner?.idUser ?? 0,
            SOBased,
            Comment: 'Model Ingested by ModelMigration',
            doNotSendIngestionEvent,
            doNotUpdateParentVersion: false
        };

        // LOG.info(`ingestStreamOrFile ${H.Helpers.JSONStringify(ISI)}`, LOG.LS.eMIG);

        const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        if (!IAR.success || !IAR.assetVersions || IAR.assetVersions.length < 1)
            return this.returnStatus('ingestModel', false, `IngestAssetResult failed: ${IAR.error}`);
        this.AssetModel = IAR.assets ?? undefined;
        this.AssetVersionModel = IAR.assetVersions;

        return { success: true };
    }

    private async ingestSupportFile(baseName: string): Promise<IngestAssetResultSkippable> {
        if (!this.model || (!this.masterModelLocation && !this.masterModelGeometryFile))
            return this.returnStatus('ingestSupportFile', false, 'model not defined');
        if (this.supportFiles.has(baseName)) {
            this.logStatus('ingestSupportFile', true, `Skipping support file ${baseName} as it was already discovered and ingested`);
            return { success: true, skipped: true };
        }
        this.supportFiles.add(baseName);

        const supportDir: string = path.dirname(this.masterModelLocation ?? this.masterModelGeometryFile ?? '');
        const supportFilePath: string = path.join(supportDir, baseName);
        const ingestTextureRes: STORE.IngestAssetResult = await this.ingestSupportFileWorker(this.model, supportFilePath);
        if (!ingestTextureRes.success || !ingestTextureRes.assetVersions || ingestTextureRes.assetVersions.length === 0) {
            const error: string = `Unable to ingest support file ${baseName} from ${supportFilePath}: ${ingestTextureRes.error}`;
            this.logStatus('ingestSupportFile', false, error);
            return { success: false, error };
        }
        return ingestTextureRes;
    }

    private async ingestSupportFileWorker(SOBased: DBAPI.SystemObjectBased, supportFilePath: string): Promise<STORE.IngestAssetResult> {
        let vAssetType: DBAPI.Vocabulary | undefined = undefined;
        switch (CACHE.VocabularyCache.mapModelAssetType(supportFilePath)) {
            case COMMON.eVocabularyID.eAssetAssetTypeModel:
            case COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile:
                vAssetType = await this.computeVocabModelGeometryFile();
                break;

            case COMMON.eVocabularyID.eAssetAssetTypeModelUVMapFile:
                vAssetType = await this.computeVocabUVMapFile();
                break;

            case COMMON.eVocabularyID.eAssetAssetTypeOther:
            default:
                vAssetType = await this.computeVocabOtherFile();
                break;
        }

        const idVAssetType: number | undefined = vAssetType?.idVocabulary;
        if (!idVAssetType)
            return this.returnStatus('ingestSupportFileWorker', false, `Unable to compute idVAssetType for file ${supportFilePath}`);
        const ISI: STORE.IngestStreamOrFileInput = {
            readStream: null,
            localFilePath: supportFilePath,
            asset: null,
            FileName: path.basename(supportFilePath),
            FilePath: '',
            idAssetGroup: 0,
            idVAssetType,
            allowZipCracking: true,
            idUserCreator: this.userOwner?.idUser ?? 0,
            SOBased,
            Comment: 'Support File Ingested by ModelMigration',
            doNotSendIngestionEvent: true,
            doNotUpdateParentVersion: false
        };

        LOG.info(`ingestSupportFileWorker ${ISI.localFilePath}`, LOG.LS.eMIG);

        const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        if (!IAR.success || !IAR.assetVersions || IAR.assetVersions.length < 1)
            return this.returnStatus('ingestSupportFileWorker', false, `ingestStreamOrFile ${ISI.localFilePath} failed: ${IAR.error}`);
        if (!this.AssetVersionSupportFile)
            this.AssetVersionSupportFile = [];
        this.AssetVersionSupportFile.push(...IAR.assetVersions);

        return IAR;
    }

    private async createModel(Name: string, eVCreationMethod?: COMMON.eVocabularyID, eVModality?: COMMON.eVocabularyID,
        eVPurpose?: COMMON.eVocabularyID, eVUnits?: COMMON.eVocabularyID): Promise<H.IOResults> {
        const vCreationMethod: DBAPI.Vocabulary | undefined = eVCreationMethod ? await CACHE.VocabularyCache.vocabularyByEnum(eVCreationMethod) : undefined;
        const vModality: DBAPI.Vocabulary | undefined = eVModality ? await CACHE.VocabularyCache.vocabularyByEnum(eVModality) : undefined;
        const vPurpose: DBAPI.Vocabulary | undefined = eVPurpose ? await CACHE.VocabularyCache.vocabularyByEnum(eVPurpose) : await this.computeVocabMaster();
        const vUnits: DBAPI.Vocabulary | undefined = eVUnits ? await CACHE.VocabularyCache.vocabularyByEnum(eVUnits) : undefined;
        const vFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(Name);
        const model: DBAPI.Model = new DBAPI.Model({
            idModel: 0,
            Name,
            Title: Name,
            DateCreated: new Date(),
            idVCreationMethod: vCreationMethod ? vCreationMethod.idVocabulary : null,
            idVModality: vModality ? vModality.idVocabulary : null,
            idVPurpose: vPurpose ? vPurpose.idVocabulary : null,
            idVUnits: vUnits ? vUnits.idVocabulary : null,
            idVFileType: vFileType ? vFileType.idVocabulary : null,
            idAssetThumbnail: null, CountAnimations: null, CountCameras: null, CountFaces: null, CountLights: null,CountMaterials: null,
            CountMeshes: null, CountVertices: null, CountEmbeddedTextures: null, CountLinkedTextures: null, FileEncoding: null, IsDracoCompressed: null,
            AutomationTag: null, CountTriangles: null
        });

        if (!await model.create())
            return this.returnStatus('createModel', false, 'Unable to create model DB Object');
        this.model = model;

        // wire item to model
        if (this.idSystemObjectItem) {
            if (!await this.wireItemToModel(this.idSystemObjectItem))
                return this.returnStatus('createModel', false, `Failed to wire media group ${this.idSystemObjectItem} to model`);
        }

        return { success: true };
    }

    private async wireItemToModel(idSystemObject: number): Promise<H.IOResults> {
        if (!this.model)
            return this.returnStatus('wireItemToModel', false, 'Called with null model');

        const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
        if (!oID)
            return this.returnStatus('wireItemToModel', false, `Unable to compute object info for ${idSystemObject}`);
        if (oID.eObjectType !== COMMON.eSystemObjectType.eItem)
            return this.returnStatus('wireItemToModel', false, `Called with non-item idSystemObject ID (${idSystemObject}):  ${H.Helpers.JSONStringify(oID)}`);

        const itemDB: DBAPI.Item | null = await DBAPI.Item.fetch(oID.idObject);
        if (!itemDB)
            return this.returnStatus('wireItemToModel', false, `Failed to fetch item ${oID.idObject}`);

        const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(itemDB, this.model);
        if (!xref)
            return this.returnStatus('wireItemToModel', false, `Unable to wire item ${H.Helpers.JSONStringify(itemDB)} to model ${H.Helpers.JSONStringify(this.model)}`);

        LOG.info(`wireItemToModel ${H.Helpers.JSONStringify(itemDB)} to model ${H.Helpers.JSONStringify(this.model)}`, LOG.LS.eMIG);
        return { success: true };
    }

    private async computeVocabMaster(): Promise<DBAPI.Vocabulary | undefined> {
        if (!ModelMigration.vocabMaster) {
            ModelMigration.vocabMaster = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeMaster);
            if (!ModelMigration.vocabMaster)
                LOG.error('ModelMigration unable to fetch vocabulary for Master Model Purpose', LOG.LS.eMIG);
        }
        return ModelMigration.vocabMaster;
    }

    private async computeVocabModelGeometryFile(): Promise<DBAPI.Vocabulary | undefined> {
        if (!ModelMigration.vocabModelGeometryFile) {
            ModelMigration.vocabModelGeometryFile = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile);
            if (!ModelMigration.vocabModelGeometryFile)
                LOG.error('ModelMigration unable to fetch vocabulary for Asset Type Model Geometry File', LOG.LS.eMIG);
        }
        return ModelMigration.vocabModelGeometryFile;
    }

    private async computeVocabUVMapFile(): Promise<DBAPI.Vocabulary | undefined> {
        if (!ModelMigration.vocabModelUVMapFile) {
            ModelMigration.vocabModelUVMapFile = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelUVMapFile);
            if (!ModelMigration.vocabModelUVMapFile)
                LOG.error('ModelMigration unable to fetch vocabulary for Asset Type Model UV Map File', LOG.LS.eMIG);
        }
        return ModelMigration.vocabModelUVMapFile;
    }

    private async computeVocabOtherFile(): Promise<DBAPI.Vocabulary | undefined> {
        if (!ModelMigration.vocabOtherFile) {
            ModelMigration.vocabOtherFile = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeOther);
            if (!ModelMigration.vocabOtherFile)
                LOG.error('ModelMigration unable to fetch vocabulary for Asset Type Other File', LOG.LS.eMIG);
        }
        return ModelMigration.vocabOtherFile;
    }

    private async ingestExplicitSupportFiles(): Promise<H.IOResults> {
        let success: boolean = true;
        let error: string | undefined = undefined;
        for (const modelFile of this.modelFileSet) {
            // Skip already-ingested geometry:
            if (modelFile.geometry)
                continue;

            const ingestTextureRes: IngestAssetResultSkippable = await this.ingestSupportFile(modelFile.fileName);
            if (ingestTextureRes.skipped)
                continue;
            if (!ingestTextureRes.success) {
                success = false;
                error = (error ? error + '; ' : '') + ingestTextureRes.error;
            }
        }
        return { success, error };
    }

    // if there are entries in expectedSupportFiles which were not discovered, those are errors
    // if there are entries in supportFiles which were not in expectedSupportFiles, those are errors
    private testSupportFiles(): H.IOResults {
        let results: H.IOResults = { success: true };
        for (const supportFile in this.supportFiles.values()) {
            if (!this.expectedSupportFiles.has(supportFile))
                results = this.returnStatus('testSupportFiles', false, `Discovered support file ${supportFile} was not expected`);
        }

        for (const expectedSupportFile in this.expectedSupportFiles.values()) {
            if (!this.supportFiles.has(expectedSupportFile))
                results = this.returnStatus('testSupportFiles', false, `Expected support file ${expectedSupportFile} was not discovered`);
        }
        return results;
    }

    private async extractTextureMaps(): Promise<H.IOResults> {
        if (!this.AssetVersionModel || this.AssetVersionModel.length === 0)
            return this.returnStatus('extractTextureMaps', false, 'AssetVersionModel is null');

        const AssetVersionModel: DBAPI.AssetVersion = this.AssetVersionModel[0];
        const jobRun: DBAPI.JobRun | null = await JobCookSIPackratInspectOutput.extractJobRunFromAssetVersion(AssetVersionModel.idAssetVersion, this.masterModelGeometryFile);
        // LOG.info(`extractTextureMaps ${H.Helpers.JSONStringify(jobRun)}`, LOG.LS.eMIG);
        if (!jobRun || !jobRun.Output)
            return this.returnStatus('extractTextureMaps', false, `failed to extract si-packrate-inspect JobRun from idAssetVersion ${AssetVersionModel.idAssetVersion}, model ${this.masterModelGeometryFile}`);

        const output: any = JSON.parse(jobRun.Output);

        // Extract support files from steps -> merge-reports -> result -> inspection -> scene -> materials[] -> channels[] -> uri
        const steps: any = output?.steps;
        const mergeReports: any = steps ? steps['merge-reports'] : undefined;
        const result: any = mergeReports ? mergeReports['result'] : undefined;
        const inspection: any = result ? result['inspection'] : undefined;
        const scene: any = inspection ? inspection['scene'] : undefined;
        const materials: any = scene ? scene['materials'] : undefined;

        if (!materials || !isArray(materials))
            return this.returnStatus('extractTextureMaps', false, `failed to extract materials from si-packrat-inspect output from idAssetVersion ${AssetVersionModel.idAssetVersion}, model ${this.masterModelGeometryFile}`);

        let success: boolean = true;
        let error: string | undefined = undefined;

        for (const material of materials) {
            const channels: any = material['channels'];
            if (channels && isArray(channels)) {
                for (const channel of channels) {
                    if (channel.uri && !isEmbeddedTexture(channel.uri)) {
                        const ingestTextureRes: IngestAssetResultSkippable = await this.ingestSupportFile(channel.uri);
                        if (ingestTextureRes.skipped)
                            continue;
                        if (!ingestTextureRes.success) {
                            success = false;
                            error = (error ? error + '; ' : '') + ingestTextureRes.error;
                        }
                    }
                }
            }
        }
        return { success, error };
    }

    private async crackOBJ(AssetVersionModel: DBAPI.AssetVersion): Promise<H.IOResults> {
        // Crack .obj to look for "mtllib" keywords (there may be multiple)
        // https://en.wikipedia.org/wiki/Wavefront_.obj_file#Material_template_library
        const res: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersion(AssetVersionModel);
        if (!res.success || !res.readStream)
            return this.returnStatus('crackOBJ', false, `Unable to readAssetVersion ${H.Helpers.JSONStringify(AssetVersionModel)}`);

        const LS: LineStream = new LineStream(res.readStream);
        const mtlLines: string[] | null = await LS.readLines('mtllib', true);
        if (!mtlLines)
            return this.returnStatus('crackOBJ', false, `Unable to extract mtllib lines from AssetVersion ${H.Helpers.JSONStringify(this.AssetVersionModel)}`);

        // e.g. mtllib eremotherium_laurillardi-150k-4096.mtl
        const mtlFiles: Set<string> = new Set<string>();
        for (const mtlLine of mtlLines) {
            if (mtlLine.toLowerCase().startsWith('mtllib ')) {
                const mtlFile: string = mtlLine.substring(7); // strip off leading 'mtllib '
                // LOG.info(`crackOBJ found MTL ${mtlFile}`, LOG.LS.eMIG);
                mtlFiles.add(mtlFile);
            }
        }

        // Ingest mtllib support files
        let success: boolean = true;
        let error: string | undefined = undefined;
        for (const mtlFile of mtlFiles.keys()) {
            const res: H.IOResults = await this.crackMTL(mtlFile);
            if (!res.success) {
                success = false;
                if (!error)
                    error = res.error;
                else
                    error = error + '; ' + res.error;
            }
        }
        return { success, error };
    }

    private async crackMTL(mtlFile: string): Promise<H.IOResults> {
        const ingestRes: IngestAssetResultSkippable = await this.ingestSupportFile(mtlFile);
        if (ingestRes.skipped)
            return { success: false, error: 'Support File Already Handled' };
        if (!ingestRes.success || !ingestRes.assetVersions || ingestRes.assetVersions.length === 0)
            return this.returnStatus('crackMTL', false, `Unable to ingest mtllib ${mtlFile}: ${ingestRes.error}`);

        const AssetVersionMTL: DBAPI.AssetVersion = ingestRes.assetVersions[0];
        const res: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersion(AssetVersionMTL);
        if (!res.success || !res.readStream)
            return this.returnStatus('crackMTL', false, `Unable to readAssetVersion for mtllib ${mtlFile} from AssetVersion ${H.Helpers.JSONStringify(AssetVersionMTL)}`);

        const LS: LineStream = new LineStream(res.readStream);
        const mtlLines: string[] | null = await LS.readLines();
        if (!mtlLines)
            return this.returnStatus('crackMTL', false, `Unable to extract lines for mtllib ${mtlFile} from AssetVersion ${H.Helpers.JSONStringify(AssetVersionMTL)}`);

        // parse MTL file, per http://paulbourke.net/dataformats/mtl/
        // and https://github.com/assimp/assimp/blob/master/code/AssetLib/Obj/ObjFileMtlImporter.cpp
        /*
            map_Ka -s 1 1 1 -o 0 0 0 -mm 0 1 chrome.mpc
            map_Kd -s 1 1 1 -o 0 0 0 -mm 0 1 chrome.mpc
            map_Ks -s 1 1 1 -o 0 0 0 -mm 0 1 chrome.mpc
            map_Ns -s 1 1 1 -o 0 0 0 -mm 0 1 wisp.mps
            map_d -s 1 1 1 -o 0 0 0 -mm 0 1 wisp.mps
            disp -s 1 1 .5 wisp.mps
            decal -s 1 1 1 -o 0 0 0 -mm 0 1 sand.mps
            bump -s 1 1 1 -o 0 0 0 -bm 1 sand.mpb
            refl -type sphere -mm 0 1 clouds.mpc
            map_Kd eremotherium_laurillardi-150k-4096-diffuse.jpg
        */
        let success: boolean = true;
        let error: string | undefined = undefined;
        for (const mtlLine of mtlLines) {
            // LOG.info(`crackMTL processing ${mtlLine}`, LOG.LS.eMIG);
            const textureMatch: RegExpMatchArray | null = mtlLine.match(ModelMigration.regexMTLParser);
            if (textureMatch && textureMatch.length >= 4) {
                // const mapType: string = textureMatch[1]?.trim();
                // const mapParams: string = textureMatch[2]?.trim();
                const mapName: string = textureMatch[3]?.trim();
                // LOG.info(`crackMTL found ${mapName}, map type ${mapType}, params ${mapParams} in ${mtlLine}`, LOG.LS.eMIG);

                // skip 'Linear' and 'Repeat', which sometimes show up incorrectly as map names
                const mapNameNorm: string = mapName.toLowerCase();
                if (mapNameNorm === 'repeat' || mapNameNorm === 'linear')
                    continue;

                // Attempt to ingest texture
                const ingestTextureRes: IngestAssetResultSkippable = await this.ingestSupportFile(mapName);
                if (!ingestTextureRes.skipped)
                    continue;
                if (!ingestTextureRes.success) {
                    success = false;
                    error = (error ? error + ': ' : '') + ingestTextureRes.error;
                }
            }
        }
        return { success, error };
    }

    private async crackGLTF(AssetVersionModel: DBAPI.AssetVersion, _glbCompressed: boolean): Promise<H.IOResults> {
        const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersion(AssetVersionModel);
        if (!RSR.success || !RSR.readStream)
            return this.returnStatus('crackGLTF', false, `Unable to readAssetVersion ${H.Helpers.JSONStringify(AssetVersionModel)}`);

        // Crack .gltf, .glb to identify .bin -> buffers[].uri; images[].uri
        const modelExtension: string = path.extname(AssetVersionModel.FileName);
        const tempFile: tmp.FileResult = await tmp.file({ mode: 0o666, postfix: modelExtension });
        let writeError: boolean = false;
        try {
            const res: H.IOResults = await H.Helpers.writeStreamToFile(RSR.readStream, tempFile.path);
            if (!res.success)
                return this.returnStatus('crackGLTF', false, `unable to copy asset version ${H.Helpers.JSONStringify(AssetVersionModel)}to ${tempFile.path}: ${res.error}`);
        } catch (err) {
            writeError = true;
            return this.returnStatus('crackGLTF', false, `Caught exception attempting to copy asset version ${H.Helpers.JSONStringify(AssetVersionModel)} to ${tempFile.path}: ${err}`);
        } finally {
            if (writeError)
                await tempFile.cleanup();
        }

        let success: boolean = true;
        let error: string | undefined = undefined;
        try {
            const io: NodeIO = new NodeIO();
            io.registerExtensions(KHRONOS_EXTENSIONS);
            io.registerDependencies({
                'draco3d.decoder': await draco3d.createDecoderModule(),
                // 'draco3d.encoder': await draco3d.createEncoderModule(),
            });
            const document: Document = await io.read(tempFile.path);
            const root: Root = document.getRoot();
            const buffers: Buffer[] = root.listBuffers();
            const textures: Texture[] = root.listTextures();

            for (const buffer of buffers) {
                const uri: string = buffer.getURI();
                if (!isEmbeddedTexture(uri)) {
                    // Attempt to ingest buffer
                    const ingestBufferRes: IngestAssetResultSkippable = await this.ingestSupportFile(uri);
                    if (!ingestBufferRes.skipped)
                        continue;
                    if (!ingestBufferRes.success) {
                        success = false;
                        error = (error ? error + ': ' : '') + ingestBufferRes.error;
                    }
                }
            }

            for (const texture of textures) {
                const uri: string = texture.getURI();
                if (!isEmbeddedTexture(uri)) {
                    // Attempt to ingest texture
                    const ingestTextureRes: IngestAssetResultSkippable = await this.ingestSupportFile(uri);
                    if (!ingestTextureRes.skipped)
                        continue;
                    if (!ingestTextureRes.success) {
                        success = false;
                        error = (error ? error + ': ' : '') + ingestTextureRes.error;
                    }
                }
            }
        } catch (err) {
            return this.returnStatus('crackGLTF', false, `Caught exception attempting to extract GLTF info from ${tempFile.path}: ${err}`);
        } finally {
            await tempFile.cleanup();
        }

        return { success, error };
    }

    private async postItemWiring(): Promise<H.IOResults> {
        this.logStatus('postItemWiring', true, 'starting');

        if (!this.model)
            return this.returnStatus('postItemWiring', false, 'called without model defined');

        // explicitly reindex model
        const nav: NAV.INavigation | null = await NAV.NavigationFactory.getInstance();
        if (!nav)
            return this.returnStatus('postItemWiring', false, 'unable to fetch navigation interface');

        const SO: DBAPI.SystemObject | null = await this.model.fetchSystemObject();
        if (!SO)
            return this.returnStatus('postItemWiring', false, `unable to fetch system object for ${H.Helpers.JSONStringify(this.model)}`);

        // index directly instead of scheduling indexing, so that we get an initial SOLR entry right away
        // NAV.NavigationFactory.scheduleObjectIndexing(SO.idSystemObject);
        const indexer: NAV.IIndexer | null = await nav.getIndexer();
        if (!indexer)
            return this.returnStatus('postItemWiring', false,  `unable to fetch navigation indexer for ${H.Helpers.JSONStringify(this.model)}`);

        indexer.indexObject(SO.idSystemObject);
        return { success: true };
    }

    private async createTestObjects(): Promise<H.IOResults> {
        if (ModelMigration.idSystemObjectTest)
            return { success: true };

        this.logStatus('createTestObjects', true, 'starting');
        const unitDB: DBAPI.Unit | null = await DBAPI.Unit.fetch(1); // Unknown Unit
        if (!unitDB)
            return this.returnStatus('createTestObjects', false, 'unable to fetch unit with ID=1 for test data');

        const Name: string = `ModelMigrationTest-${new Date().toISOString()}`;
        const subjectDB: DBAPI.Subject = new DBAPI.Subject({
            idUnit: unitDB.idUnit,
            idAssetThumbnail: null,
            idGeoLocation: null,
            Name,
            idIdentifierPreferred: null,
            idSubject: 0,
        });
        if (!await subjectDB.create())
            return this.returnStatus('createTestObjects', false, `unable to create subject ${H.Helpers.JSONStringify(subjectDB)}`);

        const itemDB: DBAPI.Item = new DBAPI.Item({
            idAssetThumbnail: null,
            idGeoLocation: null,
            Name,
            EntireSubject: true,
            Title: null,
            idItem: 0,
        });
        if (!await itemDB.create())
            return this.returnStatus('createTestObjects', false, `unable to create item ${H.Helpers.JSONStringify(itemDB)}`);

        const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(subjectDB, itemDB);
        if (!xref)
            return this.returnStatus('createTestObjects', false, `unable to wire subject ${H.Helpers.JSONStringify(subjectDB)} to item ${H.Helpers.JSONStringify(itemDB)}`);

        const SO: DBAPI.SystemObject | null = await itemDB.fetchSystemObject();
        if (!SO)
            return this.returnStatus('createTestObjects', false, `unable to fetch system object from item ${H.Helpers.JSONStringify(itemDB)}`);

        ModelMigration.idSystemObjectTest = SO.idSystemObject;
        return { success: true };
    }

    private async testFileExistence(modelFile: ModelMigrationFile): Promise<boolean> {
        const filePath: string = ModelMigrationFile.computeFilePath(modelFile);
        const res: H.StatResults = await H.Helpers.stat(filePath);
        let success: boolean = res.success && (res.stat !== null) && res.stat.isFile();

        if (modelFile.hash) {
            const hashRes: H.HashResults = await H.Helpers.computeHashFromFile(filePath, 'sha256');
            if (!hashRes.success) {
                this.logStatus(`testFileExistience('${filePath}')`, false, `unable to compute hash ${hashRes.error}`);
                success = false;
            } else if (hashRes.hash != modelFile.hash) {
                this.logStatus(`testFileExistience('${filePath}')`, false, `computed different hash ${hashRes.hash} than expected ${modelFile.hash}`);
                success = false;
            }
        }

        this.logStatus(`testFileExistience('${filePath}')`, success, `${success ? 'Exists' : 'Missing'}`);
        return success;
    }

    private logStatus(context: string, success: boolean, message: string | undefined): void {
        if (!success)
            LOG.error(`ModelMigration (${this.uniqueID}) ${context}: ${message}`, LOG.LS.eMIG);
        else
            LOG.info(`ModelMigration (${this.uniqueID}) ${context}${message ? (': ' + message) : ''}`, LOG.LS.eMIG);
    }

    private returnStatus(context: string, success: boolean, message: string | undefined, props?: any): H.IOResults { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!success)
            this.logStatus(context, success, message);
        return { success, error: message, ...props };
    }
}