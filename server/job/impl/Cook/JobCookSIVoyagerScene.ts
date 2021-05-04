/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import { JobCook } from './JobCook';
import { CookRecipe } from './CookRecipe';
import { Config } from '../../../config';

import * as JOB from '../../interface';
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as STORE from '../../../storage/interface';
import * as H from '../../../utils/helpers';
import { SvxReader } from '../../../utils/parser';
import { ASL, LocalStore } from '../../../utils/localStore';

import * as path from 'path';
import cloneable from 'cloneable-readable';
import { Readable } from 'stream';

export class JobCookSIVoyagerSceneParameters {
    constructor(idModel: number | undefined,
        sourceMeshFile: string,
        units: string,
        sourceDiffuseMapFile: string | undefined = undefined,
        svxFile: string | undefined = undefined,
        metaDataFile: string | undefined = undefined,
        outputFileBaseName: string | undefined = undefined) {
        this.idModel = idModel;
        this.sourceMeshFile = path.basename(sourceMeshFile);
        this.units = units;
        this.sourceDiffuseMapFile = sourceDiffuseMapFile ? path.basename(sourceDiffuseMapFile) : undefined;
        this.svxFile = svxFile ? path.basename(svxFile) : undefined;
        this.metaDataFile = metaDataFile ? path.basename(metaDataFile) : undefined;
        this.outputFileBaseName = outputFileBaseName ? path.basename(outputFileBaseName) : undefined;
    }
    idModel: number | undefined;
    sourceMeshFile: string;
    units: string;
    sourceDiffuseMapFile?: string | undefined;
    svxFile?: string | undefined;
    metaDataFile?: string | undefined;
    outputFileBaseName?: string | undefined;
}

export class JobCookSIVoyagerScene extends JobCook<JobCookSIVoyagerSceneParameters> {
    private parameters: JobCookSIVoyagerSceneParameters;
    private idModel: number | null;
    private cleanupCalled: boolean = false;

    constructor(jobEngine: JOB.IJobEngine, idAssetVersions: number[] | null,
        parameters: JobCookSIVoyagerSceneParameters, dbJobRun: DBAPI.JobRun) {
        super(jobEngine, Config.job.cookClientId, 'si-vogager-scene',
            CookRecipe.getCookRecipeID('si-vogager-scene', '512211e5-f2e8-4723-93e9-e30116c88ab0'),
            null, idAssetVersions, dbJobRun);
        if (parameters.idModel) {
            this.idModel = parameters.idModel ?? null;
            delete parameters.idModel; // strip this out, as Cook will choke on it!
        } else
            this.idModel = null;
        this.parameters = parameters;
    }

    async cleanupJob(): Promise<H.IOResults> {
        if (!this._results.success)
            return { success: true, error: '' };
        if (this.cleanupCalled)
            return { success: true, error: 'cleanupJob already called, exiting early' };
        this.cleanupCalled = true;

        const modelSource: DBAPI.Model | null = this.idModel ? await DBAPI.Model.fetch(this.idModel) : null;

        const svxFile: string = this.parameters.svxFile ?? 'scene.svx.json';
        const vScene: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eAssetAssetTypeScene);
        const vModel: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eAssetAssetTypeModelGeometryFile);
        if (!vScene || !vModel) {
            const error: string = `JobCookSIVoyagerScene.cleanupJob unable to calculate vocabulary needed to ingest scene file ${svxFile}`;
            LOG.error(error, LOG.LS.eJOB);
            return { success: false, error };
        }

        // Retrieve svx.json
        const RSR: STORE.ReadStreamResult = await this.fetchFile(svxFile);
        if (!RSR.success || !RSR.readStream) {
            LOG.error(`JobCookSIVoyagerScene.cleanupJob unable to fetch stream for scene file ${svxFile}: ${RSR.error}`, LOG.LS.eJOB);
            return { success: false, error: RSR.error };
        }
        LOG.info(`JobCookSIVoyagerScene.cleanupJob[${svxFile}] retrieve svx.json`, LOG.LS.eJOB);

        // create cloneable stream wrapper, so that we can load the scene into memory for processing, and also stream it out to storage as an ingested asset
        const clone = cloneable(new Readable().wrap(RSR.readStream));
        LOG.info(`JobCookSIVoyagerScene.cleanupJob[${svxFile}] create cloneable stream wrapper`, LOG.LS.eJOB);

        // Parse Scene
        const svx: SvxReader = new SvxReader();
        const res: H.IOResults = await svx.loadFromStream(RSR.readStream);
        if (!res.success || !svx.SvxExtraction) {
            LOG.error(`JobCookSIVoyagerScene.cleanupJob unable to parse scene file ${svxFile}: ${res.error}`, LOG.LS.eJOB);
            return { success: false, error: res.error };
        }
        LOG.info(`JobCookSIVoyagerScene.cleanupJob[${svxFile}] parse scene: ${JSON.stringify(svx.SvxExtraction, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eJOB);

        // Create Scene
        const scene: DBAPI.Scene = svx.SvxExtraction.extractScene();
        if (!await scene.create()) {
            LOG.error(`JobCookSIVoyagerScene.cleanupJob unable to create Scene file ${svxFile}: database error`, LOG.LS.eJOB);
            return { success: false, error: res.error };
        }
        LOG.info(`JobCookSIVoyagerScene.cleanupJob[${svxFile}] create scene: ${JSON.stringify(scene, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eJOB);

        // wire ModelSource to Scene
        if (modelSource) {
            const SOX: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, scene);
            if (!SOX) {
                LOG.error(`JobCookSIVoyagerScene.cleanupJob unable to wire Model Source ${JSON.stringify(modelSource, H.Helpers.stringifyMapsAndBigints)} to Scene ${JSON.stringify(scene, H.Helpers.stringifyMapsAndBigints)}: database error`, LOG.LS.eJOB);
                return { success: false, error: res.error };
            }
            LOG.info(`JobCookSIVoyagerScene.cleanupJob[${svxFile}] wire ModelSource to Scene: ${JSON.stringify(SOX, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eJOB);
        }

        //  Scene owns this ingested asset of the SVX File
        const LS: LocalStore | undefined = ASL.getStore();
        const idUserCreator: number = LS?.idUser ?? 0;
        const ISI: STORE.IngestStreamOrFileInput = {
            ReadStream: clone.clone(),
            LocalFilePath: null,
            FileName: svxFile,
            FilePath: '',
            idAssetGroup: 0,
            idVAssetType: vScene.idVocabulary,
            idUserCreator,
            SOBased: scene,
        };
        let ISR: STORE.IngestStreamOrFileResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        if (!ISR.success) {
            LOG.error(`JobCookSIVoyagerScene.cleanupJob unable to ingest scene file ${svxFile}: ${ISR.error}`, LOG.LS.eJOB);
            return { success: false, error: ISR.error };
        }
        LOG.info(`JobCookSIVoyagerScene.cleanupJob[${svxFile}] wire ingestStreamOrFile: ${JSON.stringify(ISI, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eJOB);

        LOG.info(`JobCookSIVoyagerScene.cleanupJob fetched scene:\n${JSON.stringify(svx.SvxExtraction, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eJOB);

        // Now extract (just) the models; per Jamie Cope 5/3/2021, each model has all textures embedded
        // How do we create the Model objects here? We can ingest the assets, as above, but we need to connect them to the right objects
        if (svx.SvxExtraction.modelDetails) {
            for (const MSX of svx.SvxExtraction.modelDetails) {
                if (MSX.Name) {
                    const model: DBAPI.Model = await this.transformModelSceneXrefIntoModel(MSX); // TODO: pass-in source model, when available
                    if (!await model.create()) {
                        const error: string = `JobCookSIVoyagerScene.cleanupJob unable to create Model from referenced model ${MSX.Name}: database error`;
                        LOG.error(error, LOG.LS.eJOB);
                        return { success: false, error };
                    }

                    // wire ModelSource to Model
                    if (modelSource) {
                        const SOX: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, model);
                        if (!SOX) {
                            LOG.error(`JobCookSIVoyagerScene.cleanupJob unable to wire Model Source ${JSON.stringify(modelSource, H.Helpers.stringifyMapsAndBigints)} to Model ${JSON.stringify(model, H.Helpers.stringifyMapsAndBigints)}: database error`, LOG.LS.eJOB);
                            return { success: false, error: res.error };
                        }
                    }

                    // Create ModelSceneXref for new model and parent scene
                    /* istanbul ignore else */
                    if (!MSX.idModelSceneXref) { // should always be true
                        MSX.idModel = model.idModel;
                        MSX.idScene = scene.idScene;
                        if (!await MSX.create()) {
                            const error: string = `JobCookSIVoyagerScene.cleanupJob unable to create ModelSceneXref for model xref ${JSON.stringify(MSX)}: database error`;
                            LOG.error(error, LOG.LS.eJOB);
                            return { success: false, error };
                        }
                    } else
                        LOG.error(`JobCookSIVoyagerScene.cleanupJob unexpected non-null ModelSceneXref for model xref ${JSON.stringify(MSX)}: database error`, LOG.LS.eJOB);

                    const SOX: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(scene, model);
                    if (!SOX) {
                        const error: string = `JobCookSIVoyagerScene.cleanupJob unable to wire Scene ${JSON.stringify(scene, H.Helpers.stringifyMapsAndBigints)} and Model ${JSON.stringify(model, H.Helpers.stringifyMapsAndBigints)} together: database error`;
                        LOG.error(error, LOG.LS.eJOB);
                        return { success: false, error };
                    }

                    const RSRModel: STORE.ReadStreamResult = await this.fetchFile(MSX.Name);
                    if (!RSRModel.success || !RSRModel.readStream) {
                        LOG.error(`JobCookSIVoyagerScene.cleanupJob unable to fetch stream for model file ${MSX.Name}: ${RSRModel.error}`, LOG.LS.eJOB);
                        return { success: false, error: RSRModel.error };
                    }

                    const FileName: string = path.basename(MSX.Name);
                    const FilePath: string = path.dirname(MSX.Name);
                    const ISIModel: STORE.IngestStreamOrFileInput = {
                        ReadStream: RSRModel.readStream,
                        LocalFilePath: null,
                        FileName,
                        FilePath,
                        idAssetGroup: 0,
                        idVAssetType: vModel.idVocabulary,
                        idUserCreator,
                        SOBased: model,
                    };
                    ISR = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISIModel);
                    if (!ISR.success) {
                        LOG.error(`JobCookSIVoyagerScene.cleanupJob unable to ingest model file ${MSX.Name}: ${ISR.error}`, LOG.LS.eJOB);
                        return { success: false, error: ISR.error };
                    }
                } else
                    LOG.error(`JobCookSIVoyagerScene.cleanupJob skipping unnamed model ${JSON.stringify(MSX)}`, LOG.LS.eJOB);
            }
        }

        return { success: true, error: '' };
    }

    protected async getParameters(): Promise<JobCookSIVoyagerSceneParameters> {
        return this.parameters;
    }

    protected async transformModelSceneXrefIntoModel(MSX: DBAPI.ModelSceneXref, source?: DBAPI.Model | undefined): Promise<DBAPI.Model> {
        const Name: string = MSX.Name ?? '';
        const vFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(Name);
        return new DBAPI.Model({
            idModel: 0,
            Name,
            DateCreated: new Date(),
            Master: false,
            Authoritative: false,
            idVCreationMethod: source?.idVCreationMethod ?? 0,
            idVModality: source?.idVModality ?? 0,
            idVPurpose: source?.idVPurpose ?? 0,
            idVUnits: source?.idVUnits ?? 0,
            idVFileType: vFileType ? vFileType.idVocabulary : 0,
            idAssetThumbnail: null, CountAnimations: null, CountCameras: null, CountFaces: null, CountLights: null,CountMaterials: null,
            CountMeshes: null, CountVertices: null, CountEmbeddedTextures: null, CountLinkedTextures: null, FileEncoding: null
        });
    }

    static async convertModelUnitsVocabToCookUnits(idVUnits: number): Promise<string | undefined> {
        // acceptable units for Cook's si-voyager-scene, as of 5/3/2021:  "mm", "cm", "m", "in", "ft", "yd"
        const eModelUnits: CACHE.eVocabularyID | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(idVUnits);
        switch (eModelUnits) {
            case CACHE.eVocabularyID.eModelUnitsMillimeter: return 'mm';
            case CACHE.eVocabularyID.eModelUnitsCentimeter: return 'cm';
            case CACHE.eVocabularyID.eModelUnitsMeter: return 'm';
            case CACHE.eVocabularyID.eModelUnitsInch: return 'in';
            case CACHE.eVocabularyID.eModelUnitsFoot: return 'ft';
            case CACHE.eVocabularyID.eModelUnitsYard: return 'yd';

            // not supported by Cook as of 5/3/2021:
            case CACHE.eVocabularyID.eModelUnitsMicrometer:
            case CACHE.eVocabularyID.eModelUnitsKilometer:
            case CACHE.eVocabularyID.eModelUnitsMile:
            case CACHE.eVocabularyID.eModelUnitsAstronomicalUnit:
            default:
                return undefined;
        }
    }
}

