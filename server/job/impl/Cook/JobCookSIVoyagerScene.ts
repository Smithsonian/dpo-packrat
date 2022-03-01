/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import { JobCook } from './JobCook';
import { CookRecipe } from './CookRecipe';
import { Config } from '../../../config';

import * as JOB from '../../interface';
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as STORE from '../../../storage/interface';
import * as REP from '../../../report/interface';
import * as H from '../../../utils/helpers';
import { SvxReader } from '../../../utils/parser';
import { ASL, LocalStore } from '../../../utils/localStore';
import { RouteBuilder, eHrefMode } from '../../../http/routes/routeBuilder';

import * as path from 'path';
import { Readable } from 'stream';

export type JobCookSIVoyagerSceneMetaDataFile = {
    edanRecordId: string;
    title: string;
    sceneTitle?: string | undefined;
};

export class JobCookSIVoyagerSceneParameterHelper {
    idModel: number;
    modelSource: DBAPI.Model;
    SOModelSource: DBAPI.SystemObject;
    OG: DBAPI.ObjectGraph;
    metaDataFileJSON: JobCookSIVoyagerSceneMetaDataFile;
    sceneName: string;

    static initialized: boolean = false;
    static idVocabEdanRecordID: number;

    constructor(idModel: number, modelSource: DBAPI.Model, SOModelSource: DBAPI.SystemObject, OG: DBAPI.ObjectGraph, metaDataFileJSON: JobCookSIVoyagerSceneMetaDataFile, sceneName: string) {
        this.idModel = idModel;
        this.modelSource = modelSource;
        this.SOModelSource = SOModelSource;
        this.OG = OG;
        this.metaDataFileJSON = metaDataFileJSON;
        this.sceneName = sceneName;
    }

    static async compute(idModel: number | undefined): Promise<JobCookSIVoyagerSceneParameterHelper | null> {
        if (!JobCookSIVoyagerSceneParameterHelper.initialized) {
            const vocabEdanRecordID: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eIdentifierIdentifierTypeEdanRecordID);
            JobCookSIVoyagerSceneParameterHelper.idVocabEdanRecordID = vocabEdanRecordID ? vocabEdanRecordID.idVocabulary : /* istanbul ignore next */ 77;
            JobCookSIVoyagerSceneParameterHelper.initialized = true;
        }

        const modelSource: DBAPI.Model | null = idModel ? await DBAPI.Model.fetch(idModel) : null;
        if (!modelSource)
            return JobCookSIVoyagerSceneParameterHelper.logError(`unable to fetch model with id ${idModel}`);

        // compute ItemParent of ModelSource
        const SOModelSource: DBAPI.SystemObject | null = await modelSource.fetchSystemObject();
        if (!SOModelSource)
            return JobCookSIVoyagerSceneParameterHelper.logError(`unable to compute system object from Model Source ${JSON.stringify(modelSource, H.Helpers.saferStringify)}`);

        const OG: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(SOModelSource.idSystemObject, DBAPI.eObjectGraphMode.eAncestors);
        if (!await OG.fetch())
            return JobCookSIVoyagerSceneParameterHelper.logError(`unable to compute object graph from Model Source ${JSON.stringify(modelSource, H.Helpers.saferStringify)}`);

        const metaDataFileJSON: JobCookSIVoyagerSceneMetaDataFile | null = await JobCookSIVoyagerSceneParameterHelper.computeSceneMetaData(OG);
        if (!metaDataFileJSON)
            return JobCookSIVoyagerSceneParameterHelper.logError(`unable to compute metadata file JSON from Model Source ${JSON.stringify(modelSource, H.Helpers.saferStringify)}`);

        const sceneName: string = metaDataFileJSON.title + (metaDataFileJSON.sceneTitle ? ': ' + metaDataFileJSON.sceneTitle : '');
        return new JobCookSIVoyagerSceneParameterHelper(idModel ?? 0, modelSource, SOModelSource, OG, metaDataFileJSON, sceneName);
    }

    private static async computeSceneMetaData(OG: DBAPI.ObjectGraph): Promise<JobCookSIVoyagerSceneMetaDataFile | null> {
        const subjects: DBAPI.Subject[] | null = OG.subject;
        if (subjects === null || subjects.length === 0 || subjects.length > 1) { // if we have no subjects or multiple subjects, return default
            LOG.error(`JobCookSIVoyagerSceneParameterExtract.computeSceneMetaData unable to compute single Subject from OG ${JSON.stringify(OG, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
            return null;
        }

        // Compute subject's Edan Record ID identifier:
        const subject: DBAPI.Subject = subjects[0];
        const SOSubject: DBAPI.SystemObject | null = await subject.fetchSystemObject();
        if (!SOSubject) {
            LOG.error(`JobCookSIVoyagerSceneParameterExtract.computeSceneMetaData unable to compute system object for Subject ${JSON.stringify(subject, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
            return null;
        }

        const identifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(SOSubject.idSystemObject);
        if (!identifiers) {
            LOG.error(`JobCookSIVoyagerSceneParameterExtract.computeSceneMetaData unable to compute identifiers for Subject System Object ${SOSubject.idSystemObject}`, LOG.LS.eJOB);
            return null;
        }

        // select first identifier of type Edan Record ID
        let edanRecordId: string = '';
        for (const identifier of identifiers) {
            if (identifier.idVIdentifierType === JobCookSIVoyagerSceneParameterHelper.idVocabEdanRecordID) {
                edanRecordId = identifier.IdentifierValue;
                break;
            }
        }

        const title: string = subject.Name;

        let sceneTitle: string | undefined = undefined;
        const items: DBAPI.Item[] | null = OG.item;
        if (items === null || items.length === 0)
            return { edanRecordId, title };

        if (items.length === 1) {               // Single item
            if (items[0].EntireSubject)         // Comprising whole subject?; use "subject name"
                sceneTitle = undefined;
            else                                // Comprising part of subject; use "subject name: item name"
                sceneTitle = items[0].Name;
        } else {                                // Multiple items, single subject, use "subject name: item1 name, item2 name, etc."
            sceneTitle = '';
            let first: boolean = true;
            for (const item of items) {
                sceneTitle += `${first ? '' : ', ' }${item.Name}`;
                first = false;
            }
        }
        return { edanRecordId, title, sceneTitle };
    }

    private static logError(errorBase: string): null {
        LOG.error(`JobCookSIVoyagerSceneParameterExtract.compute ${errorBase}`, LOG.LS.eJOB);
        return null;
    }
}

export class JobCookSIVoyagerSceneParameters {
    sourceMeshFile: string;
    units: string;
    sourceDiffuseMapFile?: string | undefined;
    svxFile?: string | undefined;
    metaDataFile?: string | undefined;
    outputFileBaseName?: string | undefined;

    // extract and remove these from the parameter object before passing to Cook
    parameterHelper?: JobCookSIVoyagerSceneParameterHelper;

    constructor(parameterHelper: JobCookSIVoyagerSceneParameterHelper,
        sourceMeshFile: string,
        units: string,
        sourceDiffuseMapFile: string | undefined = undefined,
        svxFile: string | undefined = undefined,
        metaDataFile: string | undefined = undefined,
        outputFileBaseName: string | undefined = undefined) {
        this.parameterHelper = parameterHelper;
        this.sourceMeshFile = path.basename(sourceMeshFile);
        this.units = units;
        this.sourceDiffuseMapFile = sourceDiffuseMapFile ? path.basename(sourceDiffuseMapFile) : undefined;
        this.svxFile = svxFile ? path.basename(svxFile) : undefined;
        this.metaDataFile = metaDataFile ? path.basename(metaDataFile) : undefined;
        this.outputFileBaseName = outputFileBaseName ? path.basename(outputFileBaseName) : undefined;
    }
}

export class JobCookSIVoyagerScene extends JobCook<JobCookSIVoyagerSceneParameters> {
    private parameters: JobCookSIVoyagerSceneParameters;
    private parameterHelper: JobCookSIVoyagerSceneParameterHelper | null;
    private cleanupCalled: boolean = false;

    private static vocabVoyagerSceneModel: DBAPI.Vocabulary | undefined = undefined;

    constructor(jobEngine: JOB.IJobEngine, idAssetVersions: number[] | null, report: REP.IReport | null,
        parameters: JobCookSIVoyagerSceneParameters, dbJobRun: DBAPI.JobRun) {
        super(jobEngine, Config.job.cookClientId, 'si-vogager-scene',
            CookRecipe.getCookRecipeID('si-vogager-scene', '512211e5-f2e8-4723-93e9-e30116c88ab0'),
            null, idAssetVersions, report, dbJobRun);

        if (parameters.parameterHelper) {
            this.parameterHelper = parameters.parameterHelper;
            delete parameters.parameterHelper; // strip this out, as Cook will choke on it!

            // create buffer for metadatafile
            if (!parameters.metaDataFile) {
                const metaDataFileID: number = -1;
                parameters.metaDataFile = 'PackratMetadataFile.json';
                const buffer: Buffer = Buffer.from(JSON.stringify(this.parameterHelper.metaDataFileJSON));

                const RSRs: STORE.ReadStreamResult[] = [{
                    readStream: Readable.from(buffer.toString()),
                    fileName: parameters.metaDataFile,
                    storageHash: null,
                    success: true
                }];
                this._streamOverrideMap.set(metaDataFileID, RSRs);

                if (!this._idAssetVersions)
                    this._idAssetVersions = [];
                this._idAssetVersions.push(metaDataFileID); // special ID for metadataFile
            }
        } else
            this.parameterHelper = null;
        this.parameters = parameters;
    }

    async cleanupJob(): Promise<H.IOResults> {
        try {
            if (!this._results.success)
                return { success: true };
            if (this.cleanupCalled)
                return { success: true, error: 'cleanupJob already called, exiting early' };
            this.cleanupCalled = true;

            const results: H.IOResults = await this.createSystemObjects();
            await this.appendToReportAndLog(`${this.name()} ${results.success ? 'succeeded' : 'failed: ' + results.error}`, !results.success);
            return results;
        } catch (error) {
            LOG.error('JobCookSIVoyagerScene.cleanupJob', LOG.LS.eJOB, error);
            return { success: false, error: JSON.stringify(error) };
        }
    }

    private async createSystemObjects(): Promise<H.IOResults> {
        if (!this.parameterHelper)
            return this.logError('JobCookSIVoyagerScene.createSystemObjects called without needed parameters');

        const svxFile: string = this.parameters.svxFile ?? 'scene.svx.json';
        const vScene: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeScene);
        const vModel: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile);
        if (!vScene || !vModel)
            return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to calculate vocabulary needed to ingest scene file ${svxFile}`);

        // Retrieve svx.json
        let RSR: STORE.ReadStreamResult = await this.fetchFile(svxFile);
        if (!RSR.success || !RSR.readStream)
            return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to fetch stream for scene file ${svxFile}: ${RSR.error}`);

        // Parse Scene
        const svx: SvxReader = new SvxReader();
        const res: H.IOResults = await svx.loadFromStream(RSR.readStream);
        if (!res.success || !svx.SvxExtraction)
            return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to parse scene file ${svxFile}: ${res.error}`);
        // LOG.info(`JobCookSIVoyagerScene.createSystemObjects[${svxFile}] parse scene`, LOG.LS.eJOB);
        // LOG.info(`JobCookSIVoyagerScene.createSystemObjects fetched scene:\n${JSON.stringify(svx.SvxExtraction, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eJOB);

        // Look for an existing scene, which is a child of modelSource
        // TODO: what if there are multiple?
        const modelSource: DBAPI.Model = this.parameterHelper.modelSource;
        const scenes: DBAPI.Scene[] | null = await DBAPI.Scene.fetchChildrenScenes(modelSource.idModel);
        if (!scenes)
            return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to fetch children scenes of model ${modelSource.idModel}`);

        // If needed, create a new scene (if we have no scenes, or if we have multiple scenes, then create a new one)
        const createScene: boolean = (scenes.length !== 1);
        const scene: DBAPI.Scene = createScene ? svx.SvxExtraction.extractScene() : scenes[0];
        let asset: DBAPI.Asset | null = null;
        if (createScene) {
            // compute ItemParent of ModelSource
            scene.Name = this.parameterHelper.sceneName;
            if (!await scene.create())
                return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to create Scene file ${svxFile}: database error`);

            // wire ModelSource to Scene
            const SOX: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, scene);
            if (!SOX)
                return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to wire Model Source ${JSON.stringify(modelSource, H.Helpers.saferStringify)} to Scene ${JSON.stringify(scene, H.Helpers.saferStringify)}: database error`);

            // wire ItemParent to Scene
            const OG: DBAPI.ObjectGraph = this.parameterHelper.OG;
            if (OG.item && OG.item.length > 0) {
                const SOX2: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(OG.item[0], scene);
                if (!SOX2)
                    return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to wire item ${JSON.stringify(OG.item[0], H.Helpers.saferStringify)} to Scene ${JSON.stringify(scene, H.Helpers.saferStringify)}: database error`);
            }
            // LOG.info(`JobCookSIVoyagerScene.createSystemObjects[${svxFile}] wire ModelSource to Scene: ${JSON.stringify(SOX, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eJOB);
        } else {
            // determine if we are updating an existing scene with an existing scene asset:
            const sceneSO: DBAPI.SystemObject | null = await scene.fetchSystemObject();
            if (sceneSO) {
                const sceneAssets: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromSystemObject(sceneSO.idSystemObject);
                if (sceneAssets) {
                    for (const sceneAsset of sceneAssets) {
                        if (await sceneAsset.assetType() === COMMON.eVocabularyID.eAssetAssetTypeScene) {
                            asset = sceneAsset;
                            break;
                        }
                    }
                } else
                    LOG.error(`JobCookSIVoyagerScene.createSystemObjects unable to fetch assets for scene systemobject ${JSON.stringify(sceneSO, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
            } else
                LOG.error(`JobCookSIVoyagerScene.createSystemObjects unable to fetch system object for ${JSON.stringify(scene, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
        }

        // Scene owns this ingested asset of the SVX File
        // Read file a second time ... cloneStream isn't available
        RSR = await this.fetchFile(svxFile);
        if (!RSR.success || !RSR.readStream)
            return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to fetch stream for scene file ${svxFile}: ${RSR.error}`);

        const LS: LocalStore = await ASL.getOrCreateStore();
        const idUserCreator: number = LS?.idUser ?? 0;
        const ISI: STORE.IngestStreamOrFileInput = {
            readStream: RSR.readStream,
            localFilePath: null,
            asset,
            FileName: svxFile,
            FilePath: '',
            idAssetGroup: 0,
            idVAssetType: vScene.idVocabulary,
            allowZipCracking: false,
            idUserCreator,
            SOBased: scene,
            Comment: 'Created by Cook si-voyager-scene'
        };
        let ISR: STORE.IngestStreamOrFileResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        if (!ISR.success)
            return this.logError(`unable to ingest scene file ${svxFile}: ${ISR.error}`);

        const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromScene(scene);
        const pathObject: string = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
        const hrefObject: string = H.Helpers.computeHref(pathObject, scene.Name);
        const pathDownload: string = ISR.assetVersion ? RouteBuilder.DownloadAssetVersion(ISR.assetVersion.idAssetVersion, eHrefMode.ePrependServerURL) : '';
        const hrefDownload: string = pathDownload ? ': ' + H.Helpers.computeHref(pathDownload, 'Download') : '';
        await this.appendToReportAndLog(`${this.name()} ingested scene ${hrefObject}${hrefDownload}`);

        const SOV: DBAPI.SystemObjectVersion | null | undefined = ISR.systemObjectVersion; // SystemObjectVersion for updated 'scene', with new version of scene asset
        // LOG.info(`JobCookSIVoyagerScene.createSystemObjects[${svxFile}] wire ingestStreamOrFile: ${JSON.stringify(ISI, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eJOB);

        // Now extract (just) the models; per Jamie Cope 5/3/2021, each model has all textures embedded
        // How do we create the Model objects here? We can ingest the assets, as above, but we need to connect them to the right objects
        if (svx.SvxExtraction.modelDetails) {
            for (const MSX of svx.SvxExtraction.modelDetails) {
                if (MSX.Name) {
                    // look for existing models, children of our scene, that match this model's purpose
                    let model: DBAPI.Model | null = await this.findMatchingModel(scene, MSX.computeModelAutomationTag());
                    let asset: DBAPI.Asset | null = null;

                    if (model) {
                        // if we already have a model, look for the asset that we are likely updating:
                        const modelSO: DBAPI.SystemObject | null = await model.fetchSystemObject();
                        if (modelSO) {
                            const modelAssets: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromSystemObject(modelSO.idSystemObject);
                            if (modelAssets) {
                                for (const modelAsset of modelAssets) {
                                    switch (await modelAsset.assetType()) {
                                        case COMMON.eVocabularyID.eAssetAssetTypeModel:
                                        case COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile:
                                            asset = modelAsset;
                                            break;
                                    }
                                    if (asset)
                                        break;
                                }
                            } else
                                LOG.error(`JobCookSIVoyagerScene.createSystemObjects unable to fetch assets for model systemobject ${JSON.stringify(modelSO, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
                        } else
                            LOG.error(`JobCookSIVoyagerScene.createSystemObjects unable to fetch system object for ${JSON.stringify(model, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
                    } else { // create model and related records
                        model = await this.transformModelSceneXrefIntoModel(MSX, modelSource);
                        if (!await model.create())
                            return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to create Model from referenced model ${MSX.Name}: database error`);

                        // wire ModelSource to Model
                        const SOX1: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, model);
                        if (!SOX1)
                            return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to wire Model Source ${JSON.stringify(modelSource, H.Helpers.saferStringify)} to Model ${JSON.stringify(model, H.Helpers.saferStringify)}: database error`);

                        // Create ModelSceneXref for new model and parent scene
                        /* istanbul ignore else */
                        if (!MSX.idModelSceneXref) { // should always be true
                            MSX.idModel = model.idModel;
                            MSX.idScene = scene.idScene;
                            if (!await MSX.create())
                                return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to create ModelSceneXref for model xref ${JSON.stringify(MSX)}: database error`);
                        } else
                            LOG.error(`JobCookSIVoyagerScene.createSystemObjects unexpected non-null ModelSceneXref for model xref ${JSON.stringify(MSX)}: database error`, LOG.LS.eJOB);

                        const SOX2: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(scene, model);
                        if (!SOX2)
                            return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to wire Scene ${JSON.stringify(scene, H.Helpers.saferStringify)} and Model ${JSON.stringify(model, H.Helpers.saferStringify)} together: database error`);
                    }

                    const RSRModel: STORE.ReadStreamResult = await this.fetchFile(MSX.Name);
                    if (!RSRModel.success || !RSRModel.readStream)
                        return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to fetch stream for model file ${MSX.Name}: ${RSRModel.error}`);

                    const FileName: string = path.basename(MSX.Name);
                    const FilePath: string = path.dirname(MSX.Name);
                    const ISIModel: STORE.IngestStreamOrFileInput = {
                        readStream: RSRModel.readStream,
                        localFilePath: null,
                        asset,
                        FileName,
                        FilePath,
                        idAssetGroup: 0,
                        idVAssetType: vModel.idVocabulary,
                        allowZipCracking: false,
                        idUserCreator,
                        SOBased: model,
                        Comment: 'Created by Cook si-voyager-scene',
                        doNotUpdateParentVersion: true // if needed, we update the existing system object version below
                    };
                    ISR = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISIModel);
                    if (!ISR.success)
                        return this.logError(`unable to ingest model file ${MSX.Name}: ${ISR.error}`);

                    const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromModel(model);
                    const pathObject: string = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
                    const hrefObject: string = H.Helpers.computeHref(pathObject, model.Name);
                    const pathDownload: string = ISR.assetVersion ? RouteBuilder.DownloadAssetVersion(ISR.assetVersion.idAssetVersion, eHrefMode.ePrependServerURL) : '';
                    const hrefDownload: string = pathDownload ? ': ' + H.Helpers.computeHref(pathDownload, 'Download') : '';
                    await this.appendToReportAndLog(`${this.name()} ingested model ${hrefObject}${hrefDownload}`);

                    // if an asset version was created for ingestion of this model, and if a system object version was created for scene ingestion,
                    // associate the asset version with the scene's system object version (enabling a scene package to be downloaded, even if some assets
                    // are owned by the ingested models). Note that if we *updated* models, we will be update the original models'
                    // SystemObjectVersionAssetVersionXref with records pointing to the new model asset versions
                    if (SOV && ISR.assetVersion) {
                        const SOVAVX: DBAPI.SystemObjectVersionAssetVersionXref | null =
                            await DBAPI.SystemObjectVersionAssetVersionXref.addOrUpdate(SOV.idSystemObjectVersion, ISR.assetVersion.idAsset, ISR.assetVersion.idAssetVersion);
                        if (!SOVAVX)
                            LOG.error(`JobCookSIVoyagerScene.createSystemObjects unable create/update SystemObjectVersionAssetVersionXref for ${JSON.stringify(SOV, H.Helpers.saferStringify)}, ${JSON.stringify(ISR.assetVersion, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
                    }
                } else
                    LOG.error(`JobCookSIVoyagerScene.createSystemObjects skipping unnamed model ${JSON.stringify(MSX)}`, LOG.LS.eJOB);
            }
        }

        return { success: true };
    }

    protected async getParameters(): Promise<JobCookSIVoyagerSceneParameters> {
        return this.parameters;
    }

    protected async transformModelSceneXrefIntoModel(MSX: DBAPI.ModelSceneXref, source?: DBAPI.Model | undefined): Promise<DBAPI.Model> {
        const Name: string = MSX.Name ?? '';
        const vFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(Name);
        const vPurpose: DBAPI.Vocabulary | undefined = await this.computeVocabVoyagerSceneModel();
        return new DBAPI.Model({
            idModel: 0,
            Name,
            DateCreated: new Date(),
            idVCreationMethod: source?.idVCreationMethod ?? null,
            idVModality: source?.idVModality ?? null,
            idVPurpose: vPurpose ? vPurpose.idVocabulary : null,
            idVUnits: source?.idVUnits ?? null,
            idVFileType: vFileType ? vFileType.idVocabulary : null,
            idAssetThumbnail: null, CountAnimations: null, CountCameras: null, CountFaces: null, CountLights: null,CountMaterials: null,
            CountMeshes: null, CountVertices: null, CountEmbeddedTextures: null, CountLinkedTextures: null, FileEncoding: null, IsDracoCompressed: null,
            AutomationTag: MSX.computeModelAutomationTag(), CountTriangles: null
        });
    }

    static async convertModelUnitsVocabToCookUnits(idVUnits: number | null): Promise<string | undefined> {
        if (!idVUnits)
            return undefined;

        // acceptable units for Cook's si-voyager-scene, as of 1/20/2022:  "mm", "cm", "m", "in", "ft", "yd"
        const eModelUnits: COMMON.eVocabularyID | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(idVUnits);
        switch (eModelUnits) {
            case COMMON.eVocabularyID.eModelUnitsMillimeter: return 'mm';
            case COMMON.eVocabularyID.eModelUnitsCentimeter: return 'cm';
            case COMMON.eVocabularyID.eModelUnitsMeter: return 'm';
            case COMMON.eVocabularyID.eModelUnitsInch: return 'in';
            case COMMON.eVocabularyID.eModelUnitsFoot: return 'ft';
            case COMMON.eVocabularyID.eModelUnitsYard: return 'yd';

            // not supported by Cook as of 1/20/2022:
            case COMMON.eVocabularyID.eModelUnitsMicrometer:
            case COMMON.eVocabularyID.eModelUnitsKilometer:
            case COMMON.eVocabularyID.eModelUnitsMile:
            case COMMON.eVocabularyID.eModelUnitsAstronomicalUnit:
            default:
                return undefined;
        }
    }

    private async findMatchingModel(sceneSource: DBAPI.Scene, automationTag: string): Promise<DBAPI.Model | null> {
        const matches: DBAPI.Model[] | null = await DBAPI.Model.fetchChildrenModels(null, sceneSource.idScene, automationTag);
        return matches && matches.length > 0 ? matches[0] : null;
    }

    private async computeVocabVoyagerSceneModel(): Promise<DBAPI.Vocabulary | undefined> {
        if (!JobCookSIVoyagerScene.vocabVoyagerSceneModel) {
            JobCookSIVoyagerScene.vocabVoyagerSceneModel = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeVoyagerSceneModel);
            if (!JobCookSIVoyagerScene.vocabVoyagerSceneModel)
                LOG.error('JobCookSIVoyagerScene unable to fetch vocabulary for Voyager Scene Model Model Purpose', LOG.LS.eGQL);
        }
        return JobCookSIVoyagerScene.vocabVoyagerSceneModel;
    }

    private async logError(errorBase: string): Promise<H.IOResults> {
        const error: string = `${this.name()} ${errorBase}`;
        await this.appendToReportAndLog(error, true);
        return { success: false, error };
    }
}

