/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../db';
import * as STORE from '../../storage/interface';
import * as CACHE from '../../cache';
import * as H from '../helpers';
import * as LOG from '../logger';
import { LineStream } from '../lineStream';
import { ModelMigrationResults } from './ModelMigration';
import { ModelMigrationFile } from './ModelMigrationFile';
import { MigrationUtils } from './MigrationUtils';
import { WorkflowUtil } from '../../workflow/impl/Packrat/WorkflowUtil';
import { JobCookSIPackratInspectOutput, isEmbeddedTexture } from '../../job/impl/Cook';
import * as COMMON from '@dpo-packrat/common';

import { isArray } from 'lodash';
import { NodeIO, Document, Root, Buffer, Texture } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import tmp from 'tmp-promise';
import * as path from 'path';

export class ModelDataExtraction {
    private uniqueID: string | undefined = undefined;
    private idSystemObjectItem: number | undefined;
    private masterModelGeometryFile: string | undefined = undefined;
    private masterModelLocation?: string;
    private modelFileSet: ModelMigrationFile[];

    // Computed
    private mtlFiles?: string[];
    private supportFiles: Set<string> = new Set<string>();

    private userOwner: DBAPI.User | undefined = undefined;
    private AssetModel: DBAPI.Asset[] | undefined = undefined;
    private AssetVersionModel: DBAPI.AssetVersion[] | undefined = undefined;
    private AssetVersionSupportFile: DBAPI.AssetVersion[] | undefined = undefined;
    private model: DBAPI.Model | undefined = undefined;

    private static vocabDownload: DBAPI.Vocabulary | undefined = undefined;
    private static vocabModelGeometryFile: DBAPI.Vocabulary | undefined = undefined;
    private static vocabOtherFile: DBAPI.Vocabulary | undefined = undefined;
    private static regexMTLParser: RegExp = new RegExp('(map_.*?|norm|disp|decal|bump|refl)( .*?)? ([^ ]+)\\s*$', 'i'); // [1] map type, [2] map params, [3] map name

    constructor(modelFileSet: ModelMigrationFile[]) {
        this.modelFileSet = modelFileSet;
        this.extractGeometryInfo();
    }

    private extractGeometryInfo(): boolean {
        for (const modelFile of this.modelFileSet) {
            if (modelFile.geometry) {
                this.uniqueID                   = modelFile.uniqueID;
                this.idSystemObjectItem         = modelFile.idSystemObjectItem;

                const filePath: string          = ModelMigrationFile.computeFilePath(modelFile);
                this.masterModelGeometryFile    = path.basename(filePath);
                this.masterModelLocation        = filePath;
                return true;
            }
        }
        this.uniqueID = undefined;
        this.masterModelGeometryFile = undefined;
        return false;
    }

    async fetchAndExtractInfo(): Promise<ModelMigrationResults> {
        if (!this.uniqueID || !this.masterModelGeometryFile)
            return { success: false, error: 'No geometry present in model definition' };

        let res: ModelMigrationResults;
        if (!this.userOwner)
            this.userOwner = await MigrationUtils.fetchMigrationUser();

        // Create DBAPI.Model
        res = await this.createModel(this.masterModelGeometryFile);
        if (!res.success)
            return res;

        if (!this.model)
            return this.returnStatus('fetchAndExtractInfo', false, 'DB Model not created');

        // Ingest model geometry asset as a model
        res = await this.ingestModel(this.model);
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
        this.ingestExplicitSupportFiles(); // Allow failures here, to get as many error messages as possible

        let AssetVersionSupportFileSO: DBAPI.SystemObject | null = null;
        const AssetVersionSupportFile: DBAPI.AssetVersion | null = (this.AssetVersionSupportFile) ? this.AssetVersionSupportFile[0] : null;
        if (AssetVersionSupportFile) {
            AssetVersionSupportFileSO = await AssetVersionSupportFile.fetchSystemObject();
            if (!AssetVersionSupportFileSO)
                return this.returnStatus('fetchAndExtractInfo', false, 'Support File Asset System Object not found');
        }

        if (useCook) {
            // Run Cook's si-packrat-inspect and parse Cook output to obtain list of texture maps
            res = await WorkflowUtil.computeModelMetrics(this.masterModelGeometryFile, this.model.idModel, undefined,
                AssetVersionModelSO.idSystemObject, AssetVersionSupportFileSO?.idSystemObject,
                undefined, undefined, this.userOwner.idUser);
            if (res.success)
                res = await this.extractTextureMaps();
        }

        if (!res.success)
            return res;

        const modelFilePath: string | undefined = this.masterModelLocation ? path.dirname(this.masterModelLocation) : undefined;
        return { success: true, modelFileName: this.masterModelGeometryFile, modelFilePath, model: this.model,
            asset: this.AssetModel, assetVersion: this.AssetVersionModel, supportFiles: Array.from(this.supportFiles.keys()) };
    }

    private async ingestModel(SOBased: DBAPI.SystemObjectBased): Promise<H.IOResults> {
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
            Comment: 'Model Ingested by ModelDataExtraction',
            doNotSendIngestionEvent: true,
            doNotUpdateParentVersion: false
        };

        // LOG.info(`ingestStreamOrFile ${H.Helpers.JSONStringify(ISI)}`, LOG.LS.eSYS);

        const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        if (!IAR.success || !IAR.assetVersions || IAR.assetVersions.length < 1)
            return this.returnStatus('ingestModel', false, `IngestAssetResult failed: ${IAR.error}`);
        this.AssetModel = IAR.assets ?? undefined;
        this.AssetVersionModel = IAR.assetVersions;

        return { success: true };
    }

    private async ingestSupportFile(SOBased: DBAPI.SystemObjectBased, supportFilePath: string): Promise<STORE.IngestAssetResult> {
        const vAssetType: DBAPI.Vocabulary | undefined = await this.computeVocabOtherFile();
        const idVAssetType: number | undefined = vAssetType?.idVocabulary;
        if (!idVAssetType)
            return this.returnStatus('ingestSupportFile', false, 'Unable to compute idVAssetType for other file');
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
            Comment: 'Support File Ingested by ModelDataExtraction',
            doNotSendIngestionEvent: true,
            doNotUpdateParentVersion: false
        };

        LOG.info(`ingestStreamOrFile ${ISI.localFilePath}`, LOG.LS.eSYS);

        const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        if (!IAR.success || !IAR.assetVersions || IAR.assetVersions.length < 1)
            return this.returnStatus('ingestSupportFile', false, `ingestStreamOrFile ${ISI.localFilePath} failed: ${IAR.error}`);
        if (!this.AssetVersionSupportFile)
            this.AssetVersionSupportFile = [];
        this.AssetVersionSupportFile.push(...IAR.assetVersions);

        return IAR;
    }

    private async createModel(Name: string, eVCreationMethod?: COMMON.eVocabularyID,
        eVModality?: COMMON.eVocabularyID, eVUnits?: COMMON.eVocabularyID): Promise<H.IOResults> {
        const vCreationMethod: DBAPI.Vocabulary | undefined = eVCreationMethod ? await CACHE.VocabularyCache.vocabularyByEnum(eVCreationMethod) : undefined;
        const vModality: DBAPI.Vocabulary | undefined = eVModality? await CACHE.VocabularyCache.vocabularyByEnum(eVModality) : undefined;
        const vUnits: DBAPI.Vocabulary | undefined = eVUnits ? await CACHE.VocabularyCache.vocabularyByEnum(eVUnits) : undefined;
        const vFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(Name);
        const vPurpose: DBAPI.Vocabulary | undefined = await this.computeVocabDownload();
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

    private async computeVocabDownload(): Promise<DBAPI.Vocabulary | undefined> {
        if (!ModelDataExtraction.vocabDownload) {
            ModelDataExtraction.vocabDownload = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeDownload);
            if (!ModelDataExtraction.vocabDownload)
                LOG.error('ModelDataExtraction unable to fetch vocabulary for Download Model Purpose', LOG.LS.eGQL);
        }
        return ModelDataExtraction.vocabDownload;
    }

    private async computeVocabModelGeometryFile(): Promise<DBAPI.Vocabulary | undefined> {
        if (!ModelDataExtraction.vocabModelGeometryFile) {
            ModelDataExtraction.vocabModelGeometryFile = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile);
            if (!ModelDataExtraction.vocabModelGeometryFile)
                LOG.error('ModelDataExtraction unable to fetch vocabulary for Asset Type Model Geometry File', LOG.LS.eGQL);
        }
        return ModelDataExtraction.vocabModelGeometryFile;
    }

    private async computeVocabOtherFile(): Promise<DBAPI.Vocabulary | undefined> {
        if (!ModelDataExtraction.vocabOtherFile) {
            ModelDataExtraction.vocabOtherFile = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeOther);
            if (!ModelDataExtraction.vocabOtherFile)
                LOG.error('ModelDataExtraction unable to fetch vocabulary for Asset Type Other File', LOG.LS.eGQL);
        }
        return ModelDataExtraction.vocabOtherFile;
    }

    private async ingestExplicitSupportFiles(): Promise<H.IOResults> {
        if (!this.model)
            return { success: false, error: 'model not defined' };

        let success: boolean = true;
        let error: string | undefined = undefined;
        const supportDir: string = path.dirname(this.masterModelLocation ?? this.masterModelGeometryFile ?? '');
        for (const modelFile of this.modelFileSet) {
            // Skip already-ingested geometry:
            if (modelFile.geometry)
                continue;

            if (this.supportFiles.has(modelFile.fileName)) {
                this.logStatus('ingestExplicitSupportFiles', false, `Skipping explicit support file ${modelFile.fileName} as it was already discovered and ingested`);
                continue;
            }

            const texturePath: string = path.join(supportDir, modelFile.fileName);
            const ingestTextureRes: STORE.IngestAssetResult = await this.ingestSupportFile(this.model, texturePath);
            if (!ingestTextureRes.success || !ingestTextureRes.assetVersions || ingestTextureRes.assetVersions.length === 0) {
                const errorLocal: string = `Unable to ingest explit support file ${modelFile.fileName} from ${texturePath}: ${ingestTextureRes.error}`;
                this.logStatus('ingestExplicitSupportFiles', false, errorLocal);

                success = false;
                error = (error ? error + '; ' : '') + errorLocal;
            }

            this.supportFiles.add(modelFile.fileName);
        }
        return { success, error };
    }

    private async extractTextureMaps(): Promise<H.IOResults> {
        if (!this.AssetVersionModel || this.AssetVersionModel.length === 0)
            return this.returnStatus('extractTextureMaps', false, 'AssetVersionModel is null');

        const AssetVersionModel: DBAPI.AssetVersion = this.AssetVersionModel[0];
        const jobRun: DBAPI.JobRun | null = await JobCookSIPackratInspectOutput.extractJobRunFromAssetVersion(AssetVersionModel.idAssetVersion, this.masterModelGeometryFile);
        // LOG.info(`extractTextureMaps ${H.Helpers.JSONStringify(jobRun)}`, LOG.LS.eSYS);
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

        for (const material of materials) {
            const channels: any = material['channels'];
            if (channels && isArray(channels)) {
                for (const channel of channels) {
                    if (channel.uri && !isEmbeddedTexture(channel.uri))
                        this.supportFiles.add(channel.uri);
                }
            }
        }
        return { success: true };
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
        for (const mtlLine of mtlLines) {
            if (mtlLine.toLowerCase().startsWith('mtllib ')) {
                const mtlFile: string = mtlLine.substring(7); // strip off leading 'mtllib '
                if (!this.mtlFiles)
                    this.mtlFiles = [];
                // LOG.info(`crackOBJ found MTL ${mtlFile}`, LOG.LS.eMIG);
                this.mtlFiles.push(mtlFile);
                this.supportFiles.add(mtlFile);
            }
        }

        // Ingest mtllib support files
        let success: boolean = true;
        let error: string | undefined = undefined;
        if (this.mtlFiles && this.mtlFiles.length > 0 && this.model) {
            for (const mtlFile of this.mtlFiles) {
                const res: H.IOResults = await this.crackMTL(mtlFile);
                if (!res.success) {
                    success = false;
                    if (!error)
                        error = res.error;
                    else
                        error = error + '; ' + res.error;
                }
            }
        }
        return { success, error };
    }

    private async crackMTL(mtlFile: string): Promise<H.IOResults> {
        if (!this.model || (!this.masterModelLocation && !this.masterModelGeometryFile))
            return { success: false, error: 'Missing model' };

        const supportDir: string = path.dirname(this.masterModelLocation ?? this.masterModelGeometryFile ?? '');
        const supportFilePath: string = path.join(supportDir, mtlFile);
        const ingestRes: STORE.IngestAssetResult = await this.ingestSupportFile(this.model, supportFilePath);
        if (!ingestRes.success || !ingestRes.assetVersions || ingestRes.assetVersions.length === 0)
            return this.returnStatus('crackMTL', false, `Unable to ingest mtllib ${supportFilePath}: ${ingestRes.error}`);

        const AssetVersionMTL: DBAPI.AssetVersion = ingestRes.assetVersions[0];
        const res: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersion(AssetVersionMTL);
        if (!res.success || !res.readStream)
            return this.returnStatus('crackMTL', false, `Unable to readAssetVersion for mtllib ${supportFilePath} from AssetVersion ${H.Helpers.JSONStringify(AssetVersionMTL)}`);

        const LS: LineStream = new LineStream(res.readStream);
        const mtlLines: string[] | null = await LS.readLines();
        if (!mtlLines)
            return this.returnStatus('crackMTL', false, `Unable to extract lines for mtllib ${supportFilePath} from AssetVersion ${H.Helpers.JSONStringify(AssetVersionMTL)}`);

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
            const textureMatch: RegExpMatchArray | null = mtlLine.match(ModelDataExtraction.regexMTLParser);
            if (textureMatch && textureMatch.length >= 4) {
                const mapType: string = textureMatch[1]?.trim();
                // const mapParams: string = textureMatch[2]?.trim();
                const mapName: string = textureMatch[3]?.trim();
                // LOG.info(`crackMTL found ${mapName}, map type ${mapType}, params ${mapParams} in ${mtlLine}`, LOG.LS.eMIG);

                // skip 'Linear' and 'Repeat', which sometimes show up incorrectly as map names
                const mapNameNorm: string = mapName.toLowerCase();
                if (mapNameNorm === 'repeat' || mapNameNorm === 'linear')
                    continue;

                // Attempt to ingest texture
                const texturePath: string = path.join(supportDir, mapName);
                const ingestTextureRes: STORE.IngestAssetResult = await this.ingestSupportFile(this.model, texturePath);
                if (!ingestTextureRes.success || !ingestTextureRes.assetVersions || ingestTextureRes.assetVersions.length === 0) {
                    const errorLocal: string = `Unable to ingest texture ${mapName} of type ${mapType} from ${texturePath} referenced in mtllib ${supportFilePath}: ${ingestTextureRes.error}`;
                    this.logStatus('crackMTL', false, errorLocal);
                    success = false;
                    error = (error ? error + ': ' : '') + errorLocal;
                }

                this.supportFiles.add(mapName);
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
                if (!isEmbeddedTexture(uri))
                    this.supportFiles.add(uri);
            }

            for (const texture of textures) {
                const uri: string = texture.getURI();
                if (!isEmbeddedTexture(uri))
                    this.supportFiles.add(uri);
            }
        } catch (err) {
            return this.returnStatus('crackGLTF', false, `Caught exception attempting to extract GLTF info from ${tempFile.path}: ${err}`);
        } finally {
            await tempFile.cleanup();
        }

        return { success: true };
    }

    private logStatus(context: string, success: boolean, error: string | undefined): void {
        if (!success)
            LOG.error(`ModelDataExtraction (${this.uniqueID}) ${context}: ${error}`, LOG.LS.eMIG);
        else
            LOG.info(`ModelDataExtraction (${this.uniqueID}) ${context}`, LOG.LS.eMIG);
    }

    private returnStatus(context: string, success: boolean, error: string | undefined): H.IOResults {
        if (!success)
            this.logStatus(context, success, error);
        return { success, error };
    }
}