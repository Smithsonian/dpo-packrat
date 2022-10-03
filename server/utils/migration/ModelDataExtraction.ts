/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../db';
import * as STORE from '../../storage/interface';
import * as CACHE from '../../cache';
import * as H from '../helpers';
import * as LOG from '../logger';
import * as path from 'path';
import { MigrationUtils } from './MigrationUtils';
import { WorkflowUtil } from '../../workflow/impl/Packrat/WorkflowUtil';
import { JobCookSIPackratInspectOutput } from '../../job/impl/Cook';
import * as COMMON from '@dpo-packrat/common';

import { isArray } from 'lodash';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class ModelDataExtraction {
    sequence: number;
    masterModelGeometryFile: string;
    edanRecordID?: string;
    masterModelLocation?: string;
    masterModelTextureFile?: string;

    // Computed
    mtlFile?: string;
    diffuseMapFile?: string;
    supportFiles: string[] = [];

    private userOwner: DBAPI.User | undefined = undefined;
    private AssetVersionModel: DBAPI.AssetVersion | undefined = undefined;
    private model: DBAPI.Model | undefined = undefined;

    private static vocabDownload: DBAPI.Vocabulary | undefined = undefined;
    private static vocabModelGeometryFile: DBAPI.Vocabulary | undefined = undefined;

    constructor(sequence: number,
        masterModelGeometryFile: string,
        edanRecordID?: string,
        masterModelLocation?: string,
        masterModelTextureFile?: string) {
        this.sequence = sequence;
        this.masterModelGeometryFile = masterModelGeometryFile;
        this.edanRecordID = edanRecordID;
        this.masterModelLocation = masterModelLocation;
        this.masterModelTextureFile = masterModelTextureFile;
    }

    async fetchAndExtractInfo(): Promise<H.IOResults> {
        let res: H.IOResults;
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

        if (!this.AssetVersionModel)
            return this.returnStatus('fetchAndExtractInfo', false, 'Model Asset not ingested');

        // Run Cook's si-packrat-inspect and parse Cook output to obtain list of texture maps
        res = await WorkflowUtil.computeModelMetrics(this.masterModelGeometryFile, this.model.idModel, undefined,
            this.AssetVersionModel.idAssetVersion, undefined, undefined, this.userOwner.idUser);
        if (!res.success)
            return res;

        res = await this.extractTextureMaps();
        if (!res.success)
            return res;

        // If file is .obj or .gltf, download model to crack open to detect .bin / .mtl files
        const extension: string = path.extname(this.masterModelGeometryFile).toLowerCase();
        switch (extension) {
            case '.obj':    res = await this.crackOBJ(); break;
            case '.gltf':   res = await this.crackGLTF(); break;
            case '.glb':    res = await this.crackGLTF(); break;
        }

        if (!res.success)
            return res;

        return { success: true };
    }

    private async ingestModel(SOBased: DBAPI.SystemObjectBased): Promise<H.IOResults> {
        const vAssetType: DBAPI.Vocabulary | undefined = await this.computeVocabModelGeometryFile();
        const idVAssetType: number | undefined = vAssetType?.idVocabulary;
        if (!idVAssetType)
            return this.returnStatus('ingestModel', false, 'Unable to compute idVAssetType for model geometry file');
        const FileName: string = path.basename(this.masterModelGeometryFile);
        const ISI: STORE.IngestStreamOrFileInput = {
            readStream: null,
            localFilePath: this.masterModelGeometryFile,
            asset: null,
            FileName,
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

        const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        if (!IAR.success || !IAR.assetVersions || IAR.assetVersions.length < 1)
            return this.returnStatus('ingestModel', false, `IngestAssetResult failed: ${IAR.error}`);
        this.AssetVersionModel = IAR.assetVersions[0];

        return { success: true };
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

    private async extractTextureMaps(): Promise<H.IOResults> {
        if (!this.AssetVersionModel)
            return this.returnStatus('extractTextureMaps', false, 'AssetVersionModel is null');

        const jobRun: DBAPI.JobRun | null = await JobCookSIPackratInspectOutput.extractJobRunFromAssetVersion(this.AssetVersionModel.idAssetVersion, this.masterModelGeometryFile);
        if (!jobRun || !jobRun.Output)
            return this.returnStatus('extractTextureMaps', false, `failed to extract si-packrate-inspect JobRun from idAssetVersion ${this.AssetVersionModel.idAssetVersion}, model ${this.masterModelGeometryFile}`);

        const output: any = JSON.parse(jobRun.Output);

        // Extract support files from steps -> merge-reports -> result -> inspection -> scene -> materials[] -> channels[] -> uri
        const steps: any = output?.steps;
        const mergeReports: any = steps ? steps['merge-reports'] : undefined;
        const results: any = mergeReports ? mergeReports['results'] : undefined;
        const inspection: any = results ? results['inspection'] : undefined;
        const scene: any = inspection ? inspection['scene'] : undefined;
        const materials: any = scene ? scene['materials'] : undefined;
        if (!materials || !isArray(materials))
            return this.returnStatus('extractTextureMaps', false, `failed to extract si-packrate-inspect JobRun from idAssetVersion ${this.AssetVersionModel.idAssetVersion}, model ${this.masterModelGeometryFile}`);

        for (const material of materials) {
            const channels: any = material['channels'];
            if (channels && isArray(channels)) {
                for (const channel of channels) {
                    if (channel.uri)
                        this.supportFiles.push(channel.uri);
                }
            }
        }
        return { success: true };
    }

    private async crackOBJ(): Promise<H.IOResults> {
        if (!this.AssetVersionModel)
            return this.returnStatus('crackOBJ', false, 'Missing Model Asset Version');

        // Crack .obj to look for "mtllib" keywords (there may be multiple)
        // https://en.wikipedia.org/wiki/Wavefront_.obj_file#Material_template_library
        STORE.AssetStorageAdapter.readAssetVersion(this.AssetVersionModel);
        return { success: true };
    }

    private async crackGLTF(): Promise<H.IOResults> {
        if (!this.AssetVersionModel)
            return this.returnStatus('crackOBJ', false, 'Missing Model Asset Version');

        // Crack .gltf, .glb to identify .bin -> buffers[].uri; images[].uri
        //      this.json.buffers[]; this.json.images
        // https://threejs.org/docs/#examples/en/loaders/GLTFLoader
        const loader = new GLTFLoader();
        await loader.loadAsync('url');
        return { success: true };
    }

    private returnStatus(context: string, success: boolean, error: string | undefined): H.IOResults {
        if (!success)
            LOG.error(`ModelDataExtraction.${context}: ${error}`, LOG.LS.eMIG);
        return { success, error };
    }
}