/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import { JobCook } from './JobCook';
import { CookRecipe } from './CookRecipe';
import { Config } from '../../../config';

import * as JOB from '../../interface';
import { WorkflowUtil } from '../../../workflow/impl/Packrat/WorkflowUtil';
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as STORE from '../../../storage/interface';
import * as REP from '../../../report/interface';
import * as H from '../../../utils/helpers';
import { PublishScene } from '../../../collections/impl/PublishScene';
import { ASL, LocalStore } from '../../../utils/localStore';
import { RouteBuilder, eHrefMode } from '../../../http/routes/routeBuilder';

// scene speecific
import { SvxReader } from '../../../utils/parser';
import { ModelHierarchy, NameHelpers } from '../../../utils/nameHelpers';
import { IngestTitle } from '../../../types/graphql';

import * as path from 'path';
import { Readable } from 'stream';

export class JobCookSIModelParameters {
    constructor(idScene: number | undefined,
        idModel: number | undefined,
        sourceMeshFile: string,
        svxFile: string,
        sourceDiffuseMapFile: string | undefined = undefined,
        sourceMTLFile: string | undefined = undefined,
        outputFileBaseName: string | undefined = undefined) {
        this.idScene = idScene;
        this.idModel = idModel;
        this.sourceMeshFile = path.basename(sourceMeshFile);
        this.svxFile = path.basename(svxFile);
        this.sourceDiffuseMapFile = sourceDiffuseMapFile ? path.basename(sourceDiffuseMapFile) : undefined;
        this.sourceMTLFile = sourceMTLFile ? path.basename(sourceMTLFile) : undefined;
        this.outputFileBaseName = outputFileBaseName ? path.basename(outputFileBaseName) : undefined;
    }
    idScene: number | undefined;
    idModel: number | undefined;
    sourceMeshFile: string;             // required
    svxFile: string;                    // required
    sourceMTLFile?: string | undefined;
    sourceDiffuseMapFile?: string | undefined;
    outputFileBaseName?: string | undefined;
}
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
    sceneTitle: string | undefined;

    static initialized: boolean = false;
    static idVocabEdanRecordID: number;

    constructor(idModel: number, modelSource: DBAPI.Model, SOModelSource: DBAPI.SystemObject, OG: DBAPI.ObjectGraph,
        metaDataFileJSON: JobCookSIVoyagerSceneMetaDataFile, sceneName: string, sceneTitle: string | undefined) {
        this.idModel = idModel;
        this.modelSource = modelSource;
        this.SOModelSource = SOModelSource;
        this.OG = OG;
        this.metaDataFileJSON = metaDataFileJSON;
        this.sceneName = sceneName;
        this.sceneTitle = sceneTitle;
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

        const metaDataFileJSON: JobCookSIVoyagerSceneMetaDataFile | null = await JobCookSIVoyagerSceneParameterHelper.computeSceneMetaData(OG, modelSource);
        if (!metaDataFileJSON)
            return JobCookSIVoyagerSceneParameterHelper.logError(`unable to compute metadata file JSON from Model Source ${JSON.stringify(modelSource, H.Helpers.saferStringify)}`);

        const sceneName: string = metaDataFileJSON.title + (metaDataFileJSON.sceneTitle ? ': ' + metaDataFileJSON.sceneTitle : '');
        return new JobCookSIVoyagerSceneParameterHelper(idModel ?? 0, modelSource, SOModelSource, OG, metaDataFileJSON, sceneName, metaDataFileJSON.sceneTitle);
    }

    private static async computeSceneMetaData(OG: DBAPI.ObjectGraph, modelSource: DBAPI.Model): Promise<JobCookSIVoyagerSceneMetaDataFile | null> {
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

        const MH: ModelHierarchy | null = await NameHelpers.computeModelHierarchy(modelSource);
        if (!MH) {
            LOG.error(`JobCookSIVoyagerSceneParameterExtract.computeSceneMetaData unable to compute model hierarchy from model ${H.Helpers.JSONStringify(modelSource)}`, LOG.LS.eJOB);
            return null;
        }
        const IngestTitle: IngestTitle = NameHelpers.sceneTitleOptions([MH]);
        const sceneTitle: string | undefined = IngestTitle.subtitle && IngestTitle.subtitle.length === 1 ? IngestTitle.subtitle[0] ?? undefined : undefined;
        return { edanRecordId, title: IngestTitle.title, sceneTitle };
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

export type JobCookSIGenerateDownloadsParameters = {
    model: JobCookSIModelParameters;
    scene: JobCookSIVoyagerSceneParameters;
};
export class JobCookSIGenerateDownloadsOutput {
    /** Pass in JSON.Parse(JobRun.Output || ''); returns a map of download type -> download filename */
    static async extractDownloads(output: any): Promise<Map<string, string>> {
        const downloadMap: Map<string, string> = new Map<string, string>(); // map from download type -> download filename
        /*
        const steps: any = output?.steps;
        const delivery: any = steps ? steps['delivery'] : undefined;
        const deliveryResult: any = delivery ? delivery['result'] : undefined;
        const deliveryResultFiles: any = deliveryResult ? deliveryResult['files'] : undefined;
        */
        const downloadFiles: any = output?.steps?.delivery?.result?.files;
        if (downloadFiles) {
            for (const downloadType of Object.keys(downloadFiles))
                downloadMap.set(downloadType, downloadFiles[downloadType]);
        }

        return downloadMap;
    }
}

export class JobCookSIGenerateDownloads extends JobCook<JobCookSIGenerateDownloadsParameters> {
    private parameters: JobCookSIGenerateDownloadsParameters;
    private idScene: number | null;
    private idModel: number | null;
    private cleanupCalled: boolean = false;
    private sceneParameterHelper: JobCookSIVoyagerSceneParameterHelper | null;

    private static vocabVoyagerSceneModel: DBAPI.Vocabulary | undefined = undefined;
    private static vocabAssetTypeScene: DBAPI.Vocabulary | undefined = undefined;
    private static vocabAssetTypeModelGeometryFile: DBAPI.Vocabulary | undefined = undefined;

    private static vocabDownload: DBAPI.Vocabulary | undefined = undefined;
    private static vocabModelGeometryFile: DBAPI.Vocabulary | undefined = undefined;

    constructor(jobEngine: JOB.IJobEngine, idAssetVersions: number[] | null, report: REP.IReport | null,
        parameters: JobCookSIGenerateDownloadsParameters, dbJobRun: DBAPI.JobRun) {

        // initialize the cook recipe
        super(jobEngine, Config.job.cookClientId, 'si-generate-downloads',
            CookRecipe.getCookRecipeID('si-generate-downloads', 'fcef7b5c-2df5-4a63-8fe9-365dd1a5e39c'),
            null, idAssetVersions, report, dbJobRun);

        // model parameters init
        if (parameters.model.idScene) {
            this.idScene = parameters.model.idScene ?? null;
            delete parameters.model.idScene; // strip this out, as Cook will choke on it!
        } else
            this.idScene = null;
        if (parameters.model.idModel) {
            this.idModel = parameters.model.idModel ?? null;
            delete parameters.model.idModel; // strip this out, as Cook will choke on it!
        } else
            this.idModel = null;

        // scene parameters init
        if (parameters.scene.parameterHelper) {
            this.sceneParameterHelper = parameters.scene.parameterHelper;
            delete parameters.scene.parameterHelper; // strip this out, as Cook will choke on it!

            // create buffer for metadatafile
            if (!parameters.scene.metaDataFile) {
                const metaDataFileID: number = -1;
                parameters.scene.metaDataFile = 'PackratMetadataFile.json';
                const buffer: Buffer = Buffer.from(JSON.stringify(this.sceneParameterHelper.metaDataFileJSON));

                const RSRs: STORE.ReadStreamResult[] = [{
                    readStream: Readable.from(buffer.toString()),
                    fileName: parameters.scene.metaDataFile,
                    storageHash: null,
                    success: true
                }];
                this._streamOverrideMap.set(metaDataFileID, RSRs);

                if (!this._idAssetVersions)
                    this._idAssetVersions = [];
                this._idAssetVersions.push(metaDataFileID); // special ID for metadataFile
            }
        } else
            this.sceneParameterHelper = null;

        // store parameters
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
            LOG.error('JobCookSIGenerateDownloads.cleanupJob', LOG.LS.eJOB, error);
            return { success: false, error: JSON.stringify(error) };
        }
    }

    // #region create
    private async createSystemObjects(): Promise<H.IOResults> {
        const sceneSource: DBAPI.Scene | null = this.idScene ? await DBAPI.Scene.fetch(this.idScene) : null;
        if (!sceneSource)
            return this.logError(`createSystemObjects unable to compute source scene from id ${this.idScene}`);

        const sceneSystemObject: DBAPI.SystemObject | null = await sceneSource.fetchSystemObject();
        if (!sceneSystemObject)
            return this.logError(`createSystemObjects unable to fetch scene system object from ${JSON.stringify(sceneSource, H.Helpers.saferStringify)}`);

        const modelSource: DBAPI.Model | null = this.idModel ? await DBAPI.Model.fetch(this.idModel) : null;
        if (!modelSource)
            return this.logError(`createSystemObjects unable to compute source model from id ${this.idModel}`);

        const MSXSources: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromModelAndScene(modelSource.idModel, sceneSource.idScene);
        if (!MSXSources)
            return this.logError(`createSystemObjects unable to compute ModelSceneXrefs from idModel ${this.idModel}, idScene ${this.idScene}`);

        const vModelGeometryFile: DBAPI.Vocabulary | undefined = await this.computeVocabModelGeometryFile();
        if (!vModelGeometryFile)
            return this.logError('createSystemObjects unable to calculate vocabulary needed to ingest generated downloads');

        // Retrieve generated files
        let downloadMap: Map<string, string> = new Map<string, string>(); // map from download type -> download filename
        try {
            downloadMap = await JobCookSIGenerateDownloadsOutput.extractDownloads(JSON.parse(this._dbJobRun.Output || ''));
        } catch (err) {
            const error: string = 'JobCookSIGenerateDownloadsOutput.extractDownloads failed';
            LOG.error('JobCookSIGenerateDownloadsOutput.extractDownloads failed', LOG.LS.eJOB, err);
            return { success: false, error };
        }
        LOG.info(`JobCookSIGenerateDownloads extracted download files ${JSON.stringify(downloadMap, H.Helpers.saferStringify)}`, LOG.LS.eJOB);

        // record updated asset -> asset version, for use in rolling a new SystemObjectVersion for the scene
        const assetVersionOverrideMap: Map<number, number> = new Map<number, number>();
        const LS: LocalStore = await ASL.getOrCreateStore();
        const idUserCreator: number = LS?.idUser ?? 0;

        for (const [downloadType, downloadFile] of downloadMap) {
            LOG.info(`JobCookSIGenerateDownloads processing download ${downloadFile} of type ${downloadType}`, LOG.LS.eJOB);
            const RSR: STORE.ReadStreamResult = await this.fetchFile(downloadFile);
            if (!RSR.success || !RSR.readStream)
                return this.logError(`createSystemObjects unable to fetch stream for generated download ${downloadFile}: ${RSR.error}`);

            // look for existing model, a child object of modelSource, with the matching downloadType
            let model: DBAPI.Model | null = await this.findMatchingModelFromModel(modelSource, downloadType);
            let modelSO: DBAPI.SystemObject | null = null;
            let Asset: DBAPI.Asset | null = null;

            if (model) {
                // if we already have a model, look for the asset that we are likely updating:
                modelSO = await model.fetchSystemObject();
                if (modelSO) {
                    const modelAssets: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromSystemObject(modelSO.idSystemObject);
                    if (modelAssets) {
                        for (const modelAsset of modelAssets) {
                            if (modelAsset.FileName === downloadFile) {
                                Asset = modelAsset;
                                break;
                            }
                        }
                    } else
                        LOG.error(`JobCookSIGenerateDownloads.createSystemObjects unable to fetch assets for model systemobject ${JSON.stringify(modelSO, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
                } else
                    LOG.error(`JobCookSIGenerateDownloads.createSystemObjects unable to fetch system object for ${JSON.stringify(modelSource, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
            } else {
                // create Model (for each download generated)
                model = await this.createModel(downloadFile, downloadType, modelSource);
                if (!await model.create())
                    return this.logError(`createSystemObjects unable to create model ${JSON.stringify(model, H.Helpers.saferStringify)}`);

                // link each model as derived from both the scene and the master model
                const SOX1: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(sceneSource, model);
                if (!SOX1)
                    return this.logError(`createSystemObjects unable to wire Scene ${JSON.stringify(sceneSource, H.Helpers.saferStringify)} and Model ${JSON.stringify(model, H.Helpers.saferStringify)} together`);

                const SOX2: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, model);
                if (!SOX2)
                    return this.logError(`createSystemObjects unable to wire Model Source ${JSON.stringify(modelSource, H.Helpers.saferStringify)} and Model ${JSON.stringify(model, H.Helpers.saferStringify)} together`);
            }

            // ingest model assets, and associate them with the correct model
            const ISI: STORE.IngestStreamOrFileInput = {
                readStream: RSR.readStream,
                localFilePath: null,
                asset: Asset,
                FileName: downloadFile,
                FilePath: '',
                idAssetGroup: 0,
                idVAssetType: vModelGeometryFile.idVocabulary,
                allowZipCracking: false,
                idUserCreator,
                SOBased: model,
                Comment: 'Created by Cook si-generate-downloads',
                doNotUpdateParentVersion: true // we create a new system object version below
            };

            LOG.info(`JobCookSIGenerateDownloads.createSystemObjects ingesting ${downloadFile}`, LOG.LS.eJOB);
            const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
            if (!IAR.success) {
                await this.appendToReportAndLog(`${this.name()} unable to ingest generated download model ${downloadFile}: ${IAR.error}`, true);
                continue;
                // return { success: false, error: ISR.error };
            }
            if (IAR.assetVersions && IAR.assetVersions.length > 1)
                LOG.error(`JobCookSIGenerateDownloads.createSystemObjects created multiple asset versions, unexpectedly, ingesting ${downloadFile}`, LOG.LS.eJOB);

            let idSystemObjectModel: number | null = modelSO ? modelSO.idSystemObject : null;
            if (!idSystemObjectModel) {
                const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromModel(model);
                idSystemObjectModel = SOI ? SOI.idSystemObject : null;
            }
            const assetVersion: DBAPI.AssetVersion | null = (IAR.assetVersions && IAR.assetVersions.length > 0) ? IAR.assetVersions[0] : null;
            const pathObject: string = idSystemObjectModel ? RouteBuilder.RepositoryDetails(idSystemObjectModel, eHrefMode.ePrependClientURL) : '';
            const hrefObject: string = H.Helpers.computeHref(pathObject, model.Name);
            const pathDownload: string = assetVersion ? RouteBuilder.DownloadAssetVersion(assetVersion.idAssetVersion, eHrefMode.ePrependServerURL) : '';
            const hrefDownload: string = pathDownload ? ': ' + H.Helpers.computeHref(pathDownload, 'Download') : '';
            await this.appendToReportAndLog(`${this.name()} ingested generated download model ${hrefObject}${hrefDownload}`);

            if (assetVersion)
                assetVersionOverrideMap.set(assetVersion.idAsset, assetVersion.idAssetVersion);

            // create/update ModelSceneXref for each download generated ... do after ingest so that we have the storage size available
            const FileSize: bigint | null = assetVersion ? assetVersion.StorageSize : null;
            const MSXSource: DBAPI.ModelSceneXref | null = MSXSources.length > 0 ? MSXSources[0] : null;

            const MSXs: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromModelSceneAndName(model.idModel, sceneSource.idScene, model.Name);
            let MSX: DBAPI.ModelSceneXref | null = (MSXs && MSXs.length > 0) ? MSXs[0] : null;
            let MSXResult: boolean = false;
            if (MSX) {
                MSX.FileSize = FileSize;
                MSXResult = await MSX.update();
            } else {
                MSX = new DBAPI.ModelSceneXref({
                    idModelSceneXref: 0,
                    idModel: model.idModel,
                    idScene: sceneSource.idScene,
                    Name: model.Name,
                    Usage: `Download ${downloadType}`,
                    Quality: null,
                    FileSize,
                    UVResolution: null,
                    BoundingBoxP1X: MSXSource?.BoundingBoxP1X ?? null,
                    BoundingBoxP1Y: MSXSource?.BoundingBoxP1Y ?? null,
                    BoundingBoxP1Z: MSXSource?.BoundingBoxP1Z ?? null,
                    BoundingBoxP2X: MSXSource?.BoundingBoxP2X ?? null,
                    BoundingBoxP2Y: MSXSource?.BoundingBoxP2Y ?? null,
                    BoundingBoxP2Z: MSXSource?.BoundingBoxP2Z ?? null,
                    TS0: MSXSource?.TS0 ?? null,
                    TS1: MSXSource?.TS1 ?? null,
                    TS2: MSXSource?.TS2 ?? null,
                    R0: MSXSource?.R0 ?? null,
                    R1: MSXSource?.R1 ?? null,
                    R2: MSXSource?.R2 ?? null,
                    R3: MSXSource?.R3 ?? null,
                    S0: MSXSource?.S0 ?? null,
                    S1: MSXSource?.S1 ?? null,
                    S2: MSXSource?.S2 ?? null,
                });
                MSXResult = await MSX.create();
            }

            if (!MSXResult)
                return this.logError(`createSystemObjects unable to create/update ModelSceneXref ${JSON.stringify(MSX, H.Helpers.saferStringify)}`);

            // run si-packrat-inspect on this model
            if (idSystemObjectModel) {
                const results: H.IOResults = await WorkflowUtil.computeModelMetrics(model.Name, model.idModel, idSystemObjectModel, undefined, undefined,
                    undefined, undefined /* FIXME */, idUserCreator);
                if (results.success)
                    this.appendToReportAndLog(`JobCookSIGenerateDownloads extracted model metrics for ${model.Name}`);
                else if (results.error)
                    this.logError(results.error);
            }
        }

        // Clone scene's systemObjectVersion, using the assetVersionOverrideMap populated with new/updated assets
        const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(sceneSystemObject.idSystemObject, null,
            'Created by Cook si-generate-downloads', assetVersionOverrideMap);
        if (!SOV)
            return this.logError(`createSystemObjects unable to clone SystemObjectVersion for ${JSON.stringify(sceneSystemObject, H.Helpers.saferStringify)}`);

        // Add scene asset metadata for attachments
        // LOG.info('JobCookSIGenerateDownloads.createSystemObjects calling PublishScene.extractSceneMetadata', LOG.LS.eJOB);
        const metadataResult: H.IOResults = await PublishScene.extractSceneMetadata(sceneSystemObject.idSystemObject, LS?.idUser ?? null);
        if (!metadataResult.success)
            LOG.error(`JobCookSIGenerateDownloads.createSystemObjects unable to persist scene attachment metadata: ${metadataResult.error}`, LOG.LS.eJOB);

        return { success: true };
    }
    private async createSystemObjectsAlt(): Promise<H.IOResults> {

        // grab our Packrat Scene from the database. idScene is a parameter passed in when creating this object
        const sceneSource: DBAPI.Scene | null = this.idScene ? await DBAPI.Scene.fetch(this.idScene) : null;
        if (!sceneSource)
            return this.logError(`createSystemObjects unable to compute source scene from id ${this.idScene}`);

        // grab the scene's SystemObject.
        const sceneSystemObject: DBAPI.SystemObject | null = await sceneSource.fetchSystemObject();
        if (!sceneSystemObject)
            return this.logError(`createSystemObjects unable to fetch scene system object from ${JSON.stringify(sceneSource, H.Helpers.saferStringify)}`);

        // Retrieve generated files from Cook. Cook may return multiple types of objects (models, scenes, etc.)
        let downloadMap: Map<string, string> = new Map<string, string>(); // map from download type -> download filename
        try {
            downloadMap = await JobCookSIGenerateDownloadsOutput.extractDownloads(JSON.parse(this._dbJobRun.Output || ''));
        } catch (err) {
            const error: string = 'JobCookSIGenerateDownloadsOutput.extractDownloads failed';
            LOG.error('JobCookSIGenerateDownloadsOutput.extractDownloads failed', LOG.LS.eJOB, err);
            return { success: false, error };
        }
        LOG.info(`JobCookSIGenerateDownloads extracted download files ${JSON.stringify(downloadMap, H.Helpers.saferStringify)}`, LOG.LS.eJOB);

        // if nothing returned then bail
        // TODO: if nothing returned may be Cook error, investigate
        if(downloadMap.size<=0) {
            return { success: false, error: 'JobCookSIGenerateDownloads did not receive any files to process. Cook error?' };
        }

        // array to handle accumulated errors/warning while processing files
        // returned as a string for further processing or display to user. (Q?)
        type fileProcessItem = {
            type: string;
            filename: string;
            success: boolean;
            message?: string;
        };
        const resultQueue: Array<fileProcessItem> = [];

        // record updated asset -> asset version, for use in rolling a new SystemObjectVersion for the scene
        const assetVersionOverrideMap: Map<number, number> = new Map<number, number>();
        const LS: LocalStore = await ASL.getOrCreateStore();
        const idUserCreator: number = LS?.idUser ?? 0;

        // cycle through retrieved downloads, processing each.
        for (const [downloadType, downloadFile] of downloadMap) {

            // fetch the file from WebDav shared space with Cook
            LOG.info(`JobCookSIGenerateDownloads processing download ${downloadFile} of type ${downloadType}`, LOG.LS.eJOB);
            const RSR: STORE.ReadStreamResult = await this.fetchFile(downloadFile);
            if (!RSR.success || !RSR.readStream) {
                return this.logError(`createSystemObjects unable to fetch stream for generated download ${downloadFile}: ${RSR.error}`);
            }

            // build our item for tracking the file and push into our queue
            let currentItemResult = { type: downloadType, filename: downloadFile, success: true, message: '' };
            resultQueue.push(currentItemResult);

            // handle the different files that can be returned using extension
            const fileType = this.getFileTypeFromPath(downloadFile);
            switch(fileType){
                // model/mesh
                case 'model': {
                    const result = await this.processModelFile(sceneSource, downloadType, downloadFile, idUserCreator, RSR, assetVersionOverrideMap);
                    if(result.success===false) {
                        currentItemResult = { ...currentItemResult, success: false, message: result.error?result.error:'' };
                    } else {
                        this.appendToReportAndLog(`JobCookSIGenerateDownloads successful processing of model: ${downloadFile}`);
                    }
                } break;

                // voyager scene
                case 'scene': {
                    const result = await this.processSceneFile();
                    if(result.success===false) {
                        currentItemResult = { ...currentItemResult, success: false, message: result.error?result.error:'' };
                    } else {
                        this.appendToReportAndLog(`JobCookSIGenerateDownloads successful processing of voyager scene: ${downloadFile}`);
                    }
                } break;

                // if we receive an unsupported type throw an error and notify
                default:{
                    currentItemResult = ({ ...currentItemResult, success: false, message: `unsupported downloadType: ${downloadType} | ${fileType}` });
                    this.logError(`createSystemObjects cannot process download. unsupported downloadType: ${downloadType} | ${fileType}`);
                } break;
            }
        }

        // TODO: cycle through results and determine if more logging/notifications are needed, or if we continue
        // ...

        // Clone scene's systemObjectVersion, using the assetVersionOverrideMap populated with new/updated assets
        const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(sceneSystemObject.idSystemObject, null,
            'Created by Cook si-generate-downloads', assetVersionOverrideMap);
        if (!SOV)
            return this.logError(`createSystemObjects unable to clone SystemObjectVersion for ${JSON.stringify(sceneSystemObject, H.Helpers.saferStringify)}`);

        // Add scene asset metadata for attachments
        // LOG.info('JobCookSIGenerateDownloads.createSystemObjects calling PublishScene.extractSceneMetadata', LOG.LS.eJOB);
        const metadataResult: H.IOResults = await PublishScene.extractSceneMetadata(sceneSystemObject.idSystemObject, LS?.idUser ?? null);
        if (!metadataResult.success)
            LOG.error(`JobCookSIGenerateDownloads.createSystemObjects unable to persist scene attachment metadata: ${metadataResult.error}`, LOG.LS.eJOB);

        return { success: true };
    }
    // #endregion

    protected async getParameters(): Promise<JobCookSIGenerateDownloadsParameters> {
        return this.parameters;
    }

    private async computeVocabDownload(): Promise<DBAPI.Vocabulary | undefined> {
        if (!JobCookSIGenerateDownloads.vocabDownload) {
            JobCookSIGenerateDownloads.vocabDownload = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeDownload);
            if (!JobCookSIGenerateDownloads.vocabDownload)
                LOG.error('JobCookSIGenerateDownloads unable to fetch vocabulary for Download Model Purpose', LOG.LS.eGQL);
        }
        return JobCookSIGenerateDownloads.vocabDownload;
    }

    private validFileExtensions = ['obj','fbx','ply','svx'];
    private getFileTypeFromPath(path){

        const extension = path.slice((Math.max(0, path.lastIndexOf('.')) || Infinity) + 1);

        if(extension.length <= 0 || extension === '') { return ''; }
        if(this.validFileExtensions.includes(extension)==false) { return ''; }

        switch(extension){
            case 'fbx':
            case 'ply':
            case 'obj': { return 'model'; }

            case 'vxs': { return 'scene'; }

            default: { return ''; }
        }
    }

    private logError(errorMessage: string): H.IOResults {
        const error: string = `JobCookSIGenerateDownloads.${errorMessage}`;
        LOG.error(error, LOG.LS.eJOB);
        return { success: false, error };
    }

    //------------------------------------------------------------------------------
    // MODEL
    //------------------------------------------------------------------------------
    // #region model
    private async processModelFile(sceneSource: DBAPI.Scene, downloadType: string, downloadFile: string, idUserCreator: number, RSR: STORE.ReadStreamResult, assetVersionOverrideMap: Map<number, number> ): Promise<H.IOResults> {

        // verify input
        if(!sceneSource || downloadFile.length<=0 || idUserCreator < 0 || RSR == null) {
            return { success: false, error: `invalid parameters passed for ${downloadFile}` };
        }

        // TODO: check model type is an accepted type
        // validModelTypes: string[] = ['test_model'];
        // if(this.validModelTypes.includes(downloadType)===false){
        //     return { success: false, error: `unsupported model type ${downloadType} provided for: ${downloadFile}` };
        // }

        // grab our Model object from the database. We need this for...
        const modelSource: DBAPI.Model | null = this.idModel ? await DBAPI.Model.fetch(this.idModel) : null;
        if (!modelSource)
            return this.logError(`createSystemObjects unable to compute source model from id ${this.idModel}`);

        // grab our ModelSceneXref from the database. This is used for...
        const MSXSources: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromModelAndScene(modelSource.idModel, sceneSource.idScene);
        if (!MSXSources)
            return this.logError(`createSystemObjects unable to compute ModelSceneXrefs from idModel ${this.idModel}, idScene ${this.idScene}`);

        // determine the vocabulary needed for ingestion. vocabulary is used for...
        const vModelGeometryFile: DBAPI.Vocabulary | undefined = await this.computeVocabModelGeometryFile();
        if (!vModelGeometryFile)
            return this.logError('createSystemObjects unable to calculate vocabulary needed to ingest generated downloads');

        // look for existing model, a child object of modelSource, with the matching downloadType
        let model: DBAPI.Model | null = await this.findMatchingModelFromModel(modelSource, downloadType);
        let modelSO: DBAPI.SystemObject | null = null;
        let Asset: DBAPI.Asset | null = null;

        // if we found a matching model then we update it. otherwise, we create a new one
        if (model) {
            // if we already have a model, look for the asset that we are likely updating:
            modelSO = await model.fetchSystemObject();
            if (modelSO) {
                const modelAssets: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromSystemObject(modelSO.idSystemObject);
                if (modelAssets) {
                    for (const modelAsset of modelAssets) {
                        if (modelAsset.FileName === downloadFile) {
                            Asset = modelAsset;
                            break;
                        }
                    }
                } else {
                    const name = JSON.stringify(modelSO, H.Helpers.saferStringify);
                    return { success: false, error: `unable to fetch assets for model system object ${name}` };
                }
            } else {
                const name = JSON.stringify(modelSource, H.Helpers.saferStringify);
                return { success: false, error: `unable to fetch system object ${name}` };
            }
        } else {
            // create Model (for each download generated)
            model = await this.createModel(downloadFile, downloadType, modelSource);
            if (!await model.create()) {
                const name = JSON.stringify(model, H.Helpers.saferStringify);
                return { success: false, error: `unable to create model: ${name}` };
            }

            // link each model as derived from both the scene and the master model
            const SOX1: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(sceneSource, model);
            if (!SOX1) {
                return { success: false, error: `unable to wire scene: ${JSON.stringify(sceneSource, H.Helpers.saferStringify)} and Model ${JSON.stringify(model, H.Helpers.saferStringify)} together` };
            }

            const SOX2: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, model);
            if (!SOX2) {
                return { success: false, error: `unable to wire model source: ${JSON.stringify(modelSource, H.Helpers.saferStringify)} and Model ${JSON.stringify(model, H.Helpers.saferStringify)} together` };
            }
        }

        // ingest model assets, and associate them with the correct model
        const ISI: STORE.IngestStreamOrFileInput = {
            readStream: RSR.readStream,
            localFilePath: null,
            asset: Asset,
            FileName: downloadFile,
            FilePath: '',
            idAssetGroup: 0,
            idVAssetType: vModelGeometryFile.idVocabulary,
            allowZipCracking: false,
            idUserCreator,
            SOBased: model,
            Comment: 'Created by Cook si-generate-downloads',
            doNotUpdateParentVersion: true // we create a new system object version below
        };

        LOG.info(`JobCookSIGenerateDownloads.createSystemObjects ingesting ${downloadFile}`, LOG.LS.eJOB);
        const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        if (!IAR.success) {
            await this.appendToReportAndLog(`${this.name()} unable to ingest generated download model ${downloadFile}: ${IAR.error}`, true);
            return { success: false, error: `unable to ingest generated download model ${downloadFile}` };
            // return { success: false, error: ISR.error };
        }

        // (Q?) what problem(s) does this cause?
        if (IAR.assetVersions && IAR.assetVersions.length > 1){
            LOG.error(`JobCookSIGenerateDownloads.createSystemObjects created multiple asset versions, unexpectedly, ingesting ${downloadFile}`, LOG.LS.eJOB);
        }

        // if no SysObj exists for this model then we check our cache for one
        let idSystemObjectModel: number | null = modelSO ? modelSO.idSystemObject : null;
        if (!idSystemObjectModel) {
            const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromModel(model);
            idSystemObjectModel = SOI ? SOI.idSystemObject : null;
        }

        // ...
        const assetVersion: DBAPI.AssetVersion | null = (IAR.assetVersions && IAR.assetVersions.length > 0) ? IAR.assetVersions[0] : null;
        const pathObject: string = idSystemObjectModel ? RouteBuilder.RepositoryDetails(idSystemObjectModel, eHrefMode.ePrependClientURL) : '';
        const hrefObject: string = H.Helpers.computeHref(pathObject, model.Name);
        const pathDownload: string = assetVersion ? RouteBuilder.DownloadAssetVersion(assetVersion.idAssetVersion, eHrefMode.ePrependServerURL) : '';
        const hrefDownload: string = pathDownload ? ': ' + H.Helpers.computeHref(pathDownload, 'Download') : '';
        await this.appendToReportAndLog(`${this.name()} ingested generated download model ${hrefObject}${hrefDownload}`);

        // currently not passed in. how is this used?
        if (assetVersion)
            assetVersionOverrideMap.set(assetVersion.idAsset, assetVersion.idAssetVersion);

        // create/update ModelSceneXref for each download generated ... do after ingest so that we have the storage size available
        const FileSize: bigint | null = assetVersion ? assetVersion.StorageSize : null;
        const MSXSource: DBAPI.ModelSceneXref | null = MSXSources.length > 0 ? MSXSources[0] : null;

        // get our ModelSceneXref from the name in the DB or create a new one
        const MSXs: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromModelSceneAndName(model.idModel, sceneSource.idScene, model.Name);
        let MSX: DBAPI.ModelSceneXref | null = (MSXs && MSXs.length > 0) ? MSXs[0] : null;
        let MSXResult: boolean = false;
        if (MSX) {
            MSX.FileSize = FileSize;
            MSXResult = await MSX.update();
        } else {
            MSX = new DBAPI.ModelSceneXref({
                idModelSceneXref: 0,
                idModel: model.idModel,
                idScene: sceneSource.idScene,
                Name: model.Name,
                Usage: `Download ${downloadType}`,
                Quality: null,
                FileSize,
                UVResolution: null,
                BoundingBoxP1X: MSXSource?.BoundingBoxP1X ?? null,
                BoundingBoxP1Y: MSXSource?.BoundingBoxP1Y ?? null,
                BoundingBoxP1Z: MSXSource?.BoundingBoxP1Z ?? null,
                BoundingBoxP2X: MSXSource?.BoundingBoxP2X ?? null,
                BoundingBoxP2Y: MSXSource?.BoundingBoxP2Y ?? null,
                BoundingBoxP2Z: MSXSource?.BoundingBoxP2Z ?? null,
                TS0: MSXSource?.TS0 ?? null,
                TS1: MSXSource?.TS1 ?? null,
                TS2: MSXSource?.TS2 ?? null,
                R0: MSXSource?.R0 ?? null,
                R1: MSXSource?.R1 ?? null,
                R2: MSXSource?.R2 ?? null,
                R3: MSXSource?.R3 ?? null,
                S0: MSXSource?.S0 ?? null,
                S1: MSXSource?.S1 ?? null,
                S2: MSXSource?.S2 ?? null,
            });
            MSXResult = await MSX.create();
        }

        // TODO: if failed cleanup prior ingestion?
        if (!MSXResult){
            return { success: false, error: `cannot create/update ModelSceneXref ${JSON.stringify(MSX, H.Helpers.saferStringify)}` };
        }

        // run si-packrat-inspect on this model to get the metrics and make sure it's valid
        if (idSystemObjectModel) {
            const results: H.IOResults = await WorkflowUtil.computeModelMetrics(model.Name, model.idModel, idSystemObjectModel, undefined, undefined,
                undefined, undefined /* FIXME */, idUserCreator);
            if (results.success)
                this.appendToReportAndLog(`JobCookSIGenerateDownloads extracted model metrics for ${model.Name}`);
            else if (results.error) {
                // TODO: cleanup ingestion
                return { success: false, error: `something went wrong inspecting the model: ${model.Name}` };
            }
        }

        return { success: true };
    }

    public static computeModelAutomationTag(downloadType: string): string {
        return `download-${downloadType}`;
    }

    private async createModel(Name: string, downloadType: string, modelSource: DBAPI.Model): Promise<DBAPI.Model> {
        const vFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(Name);
        const vPurpose: DBAPI.Vocabulary | undefined = await this.computeVocabDownload();
        return new DBAPI.Model({
            idModel: 0,
            Name,
            Title: modelSource.Title,
            DateCreated: new Date(),
            idVCreationMethod: modelSource.idVCreationMethod,
            idVModality: modelSource.idVModality,
            idVPurpose: vPurpose ? vPurpose.idVocabulary : null,
            idVUnits: modelSource.idVUnits,
            idVFileType: vFileType ? vFileType.idVocabulary : null,
            idAssetThumbnail: null, CountAnimations: null, CountCameras: null, CountFaces: null, CountLights: null,CountMaterials: null,
            CountMeshes: null, CountVertices: null, CountEmbeddedTextures: null, CountLinkedTextures: null, FileEncoding: null, IsDracoCompressed: null,
            AutomationTag: JobCookSIGenerateDownloads.computeModelAutomationTag(downloadType), CountTriangles: null
        });
    }

    private async computeVocabModelGeometryFile(): Promise<DBAPI.Vocabulary | undefined> {
        if (!JobCookSIGenerateDownloads.vocabModelGeometryFile) {
            JobCookSIGenerateDownloads.vocabModelGeometryFile = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile);
            if (!JobCookSIGenerateDownloads.vocabModelGeometryFile)
                LOG.error('JobCookSIGenerateDownloads unable to fetch vocabulary for Asset Type Model Geometry File', LOG.LS.eGQL);
        }
        return JobCookSIGenerateDownloads.vocabModelGeometryFile;
    }

    private async findMatchingModelFromModel(modelSource: DBAPI.Model, downloadType: string): Promise<DBAPI.Model | null> {
        const matches: DBAPI.Model[] | null = await DBAPI.Model.fetchChildrenModels(modelSource.idModel, null, JobCookSIGenerateDownloads.computeModelAutomationTag(downloadType));
        return matches && matches.length > 0 ? matches[0] : null;
    }
    // #endregion

    //------------------------------------------------------------------------------
    // SCENE
    //------------------------------------------------------------------------------
    // #region scene
    private async processSceneFile(): Promise<H.IOResults> {

        if (!this.sceneParameterHelper)
            return this.logError('JobCookSIVoyagerScene.createSystemObjects called without needed parameters');

        const svxFile: string = this.parameters.scene.svxFile ?? 'scene.svx.json';
        const vScene: DBAPI.Vocabulary | undefined = await this.computeVocabAssetTypeScene();
        const vModel: DBAPI.Vocabulary | undefined = await this.computeVocabAssetTypeModelGeometryFile();
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
        const modelSource: DBAPI.Model = this.sceneParameterHelper.modelSource;
        const scenes: DBAPI.Scene[] | null = await DBAPI.Scene.fetchChildrenScenes(modelSource.idModel);
        if (!scenes)
            return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to fetch children scenes of model ${modelSource.idModel}`);

        // If needed, create a new scene (if we have no scenes, or if we have multiple scenes, then create a new one);
        // If we have just one scene, before reusing it, see if the model names all match up
        let createScene: boolean = (scenes.length !== 1);
        if (!createScene && scenes.length > 0 && svx.SvxExtraction.modelDetails) {
            for (const MSX of svx.SvxExtraction.modelDetails) {
                if (MSX.Name) {
                    // look for existing models, children of our scene, that match this model's purpose
                    const model: DBAPI.Model | null = await this.findMatchingModelFromScene(scenes[0], MSX.computeModelAutomationTag());
                    if (!model || (model.Name !== MSX.Name)) {
                        createScene = true;
                        break;
                    }
                }
            }
        }

        const scene: DBAPI.Scene = createScene ? svx.SvxExtraction.extractScene() : scenes[0];

        let asset: DBAPI.Asset | null = null;
        if (createScene) {
            // compute ItemParent of ModelSource
            scene.Name = this.sceneParameterHelper.sceneName;
            if (this.sceneParameterHelper.sceneTitle)
                scene.Title = this.sceneParameterHelper.sceneTitle;
            if (!await scene.create())
                return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to create Scene file ${svxFile}: database error`);

            // wire ModelSource to Scene
            const SOX: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, scene);
            if (!SOX)
                return this.logError(`JobCookSIVoyagerScene.createSystemObjects unable to wire Model Source ${JSON.stringify(modelSource, H.Helpers.saferStringify)} to Scene ${JSON.stringify(scene, H.Helpers.saferStringify)}: database error`);

            // wire ItemParent to Scene
            const OG: DBAPI.ObjectGraph = this.sceneParameterHelper.OG;
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
        let IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        if (!IAR.success)
            return this.logError(`unable to ingest scene file ${svxFile}: ${IAR.error}`);
        if (IAR.assetVersions && IAR.assetVersions.length > 1)
            LOG.error(`JobCookSIVoyagerScene.createSystemObjects created multiple asset versions, unexpectedly, ingesting ${svxFile}`, LOG.LS.eJOB);

        const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromScene(scene);
        const assetVersion: DBAPI.AssetVersion | null = (IAR.assetVersions && IAR.assetVersions.length > 0) ? IAR.assetVersions[0] : null;
        const pathObject: string = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
        const hrefObject: string = H.Helpers.computeHref(pathObject, scene.Name);
        const pathDownload: string = assetVersion ? RouteBuilder.DownloadAssetVersion(assetVersion.idAssetVersion, eHrefMode.ePrependServerURL) : '';
        const hrefDownload: string = pathDownload ? ': ' + H.Helpers.computeHref(pathDownload, 'Download') : '';
        await this.appendToReportAndLog(`${this.name()} ingested scene ${hrefObject}${hrefDownload}`);

        const SOV: DBAPI.SystemObjectVersion | null | undefined = IAR.systemObjectVersion; // SystemObjectVersion for updated 'scene', with new version of scene asset
        // LOG.info(`JobCookSIVoyagerScene.createSystemObjects[${svxFile}] wire ingestStreamOrFile: ${JSON.stringify(ISI, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eJOB);

        // Now extract (just) the models; per Jamie Cope 5/3/2021, each model has all textures embedded
        // How do we create the Model objects here? We can ingest the assets, as above, but we need to connect them to the right objects
        if (svx.SvxExtraction.modelDetails) {
            for (const MSX of svx.SvxExtraction.modelDetails) {
                if (MSX.Name) {
                    // look for existing models, children of our scene, that match this model's purpose
                    let model: DBAPI.Model | null = await this.findMatchingModelFromScene(scene, MSX.computeModelAutomationTag());
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
                    IAR = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISIModel);
                    if (!IAR.success)
                        return this.logError(`unable to ingest model file ${MSX.Name}: ${IAR.error}`);
                    if (IAR.assetVersions && IAR.assetVersions.length > 1)
                        LOG.error(`JobCookSIVoyagerScene.createSystemObjects created multiple asset versions, unexpectedly, ingesting ${MSX.Name}`, LOG.LS.eJOB);

                    const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromModel(model);
                    const assetVersion: DBAPI.AssetVersion | null = (IAR.assetVersions && IAR.assetVersions.length > 0) ? IAR.assetVersions[0] : null;
                    const pathObject: string = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
                    const hrefObject: string = H.Helpers.computeHref(pathObject, model.Name);
                    const pathDownload: string = assetVersion ? RouteBuilder.DownloadAssetVersion(assetVersion.idAssetVersion, eHrefMode.ePrependServerURL) : '';
                    const hrefDownload: string = pathDownload ? ': ' + H.Helpers.computeHref(pathDownload, 'Download') : '';
                    await this.appendToReportAndLog(`${this.name()} ingested model ${hrefObject}${hrefDownload}`);

                    // if an asset version was created for ingestion of this model, and if a system object version was created for scene ingestion,
                    // associate the asset version with the scene's system object version (enabling a scene package to be downloaded, even if some assets
                    // are owned by the ingested models). Note that if we *updated* models, we will be update the original models'
                    // SystemObjectVersionAssetVersionXref with records pointing to the new model asset versions
                    if (SOV && assetVersion) {
                        const SOVAVX: DBAPI.SystemObjectVersionAssetVersionXref | null =
                            await DBAPI.SystemObjectVersionAssetVersionXref.addOrUpdate(SOV.idSystemObjectVersion, assetVersion.idAsset, assetVersion.idAssetVersion);
                        if (!SOVAVX)
                            LOG.error(`JobCookSIVoyagerScene.createSystemObjects unable create/update SystemObjectVersionAssetVersionXref for ${JSON.stringify(SOV, H.Helpers.saferStringify)}, ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
                    }

                    // run si-packrat-inspect on this model
                    const results: H.IOResults = await WorkflowUtil.computeModelMetrics(FileName, model.idModel, undefined, undefined, undefined,
                        undefined, undefined /* FIXME */, idUserCreator);
                    if (results.success)
                        this.appendToReportAndLog(`JobCookSIVoyagerScene extracted model metrics for ${FileName}`);
                    else if (results.error)
                        this.logError(results.error);
                } else
                    LOG.error(`JobCookSIVoyagerScene.createSystemObjects skipping unnamed model ${JSON.stringify(MSX)}`, LOG.LS.eJOB);
            }
        }

        return { success: true };
    }

    protected async transformModelSceneXrefIntoModel(MSX: DBAPI.ModelSceneXref, source?: DBAPI.Model | undefined): Promise<DBAPI.Model> {
        const Name: string = MSX.Name ?? '';
        const vFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(Name);
        const vPurpose: DBAPI.Vocabulary | undefined = await this.computeVocabVoyagerSceneModel();
        return new DBAPI.Model({
            idModel: 0,
            Name,
            Title: source?.Title ?? '',
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

    private async findMatchingModelFromScene(sceneSource: DBAPI.Scene, automationTag: string): Promise<DBAPI.Model | null> {
        const matches: DBAPI.Model[] | null = await DBAPI.Model.fetchChildrenModels(null, sceneSource.idScene, automationTag);
        return matches && matches.length > 0 ? matches[0] : null;
    }

    private async computeVocabVoyagerSceneModel(): Promise<DBAPI.Vocabulary | undefined> {
        if (!JobCookSIGenerateDownloads.vocabVoyagerSceneModel) {
            JobCookSIGenerateDownloads.vocabVoyagerSceneModel = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeVoyagerSceneModel);
            if (!JobCookSIGenerateDownloads.vocabVoyagerSceneModel)
                LOG.error('JobCookSIGenerateDownloads unable to fetch vocabulary for Voyager Scene Model Model Purpose', LOG.LS.eGQL);
        }
        return JobCookSIGenerateDownloads.vocabVoyagerSceneModel;
    }

    private async computeVocabAssetTypeScene(): Promise<DBAPI.Vocabulary | undefined> {
        if (!JobCookSIGenerateDownloads.vocabAssetTypeScene) {
            JobCookSIGenerateDownloads.vocabAssetTypeScene = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeScene);
            if (!JobCookSIGenerateDownloads.vocabAssetTypeScene)
                LOG.error('JobCookSIGenerateDownloads unable to fetch vocabulary for Asset Type Scene', LOG.LS.eGQL);
        }
        return JobCookSIGenerateDownloads.vocabAssetTypeScene;
    }

    private async computeVocabAssetTypeModelGeometryFile(): Promise<DBAPI.Vocabulary | undefined> {
        if (!JobCookSIGenerateDownloads.vocabAssetTypeModelGeometryFile) {
            JobCookSIGenerateDownloads.vocabAssetTypeModelGeometryFile = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile);
            if (!JobCookSIGenerateDownloads.vocabAssetTypeModelGeometryFile)
                LOG.error('JobCookSIGenerateDownloads unable to fetch vocabulary for Asset Type Model Geometry File', LOG.LS.eGQL);
        }
        return JobCookSIGenerateDownloads.vocabAssetTypeModelGeometryFile;
    }
    // #endregion
}
