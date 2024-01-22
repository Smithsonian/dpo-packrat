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
import { JobCookSIVoyagerSceneParameterHelper } from './JobCookSIVoyagerScene';

// system specific
import * as path from 'path';
import { Readable } from 'stream';

type FileProcessItem = {
    downloadType: string;
    fileType: string;
    fileName: string;
    success: boolean;
    error?: string;
    RSR?: STORE.ReadStreamResult;
    data?: any;
};

export class JobCookSIGenerateDownloadsParameters {
    constructor(idScene: number | undefined,
        idModel: number | undefined,
        sourceMeshFile: string,
        svxFile: string,
        sourceDiffuseMapFile: string | undefined = undefined,
        sourceMTLFile: string | undefined = undefined,
        outputFileBaseName: string | undefined = undefined,
        units: string | undefined = undefined,
        metaDataFile: string | undefined = undefined,
        parameterHelper: JobCookSIVoyagerSceneParameterHelper | undefined = undefined) {

        this.idScene = idScene;
        this.idModel = idModel;
        this.sourceMeshFile = path.basename(sourceMeshFile);
        this.svxFile = path.basename(svxFile);
        this.sourceDiffuseMapFile = sourceDiffuseMapFile ? path.basename(sourceDiffuseMapFile) : undefined;
        this.sourceMTLFile = sourceMTLFile ? path.basename(sourceMTLFile) : undefined;
        this.outputFileBaseName = outputFileBaseName ? path.basename(outputFileBaseName) : undefined;
        this.units = units ? units : undefined;
        this.metaDataFile = metaDataFile ? metaDataFile : undefined;
        this.parameterHelper = parameterHelper ? parameterHelper : undefined;
    }

    idScene: number | undefined;
    idModel: number | undefined;
    sourceMeshFile: string;             // required
    svxFile: string;                    // required
    sourceMTLFile?: string | undefined;
    sourceDiffuseMapFile?: string | undefined;
    outputFileBaseName?: string | undefined;
    units: string | undefined;
    metaDataFile?: string | undefined;

    // extract and remove these from the parameter object before passing to Cook
    parameterHelper?: JobCookSIVoyagerSceneParameterHelper;
}

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
        if (parameters.idScene) {
            this.idScene = parameters.idScene ?? null;
            delete parameters.idScene; // strip this out, as Cook will choke on it!
        } else
            this.idScene = null;
        if (parameters.idModel) {
            this.idModel = parameters.idModel ?? null;
            delete parameters.idModel; // strip this out, as Cook will choke on it!
        } else
            this.idModel = null;

        // scene parameters init
        if (parameters.parameterHelper) {
            this.sceneParameterHelper = parameters.parameterHelper;
            delete parameters.parameterHelper; // strip this out, as Cook will choke on it!

            // create buffer for metadatafile
            if (!parameters.metaDataFile) {
                const metaDataFileID: number = -1;
                parameters.metaDataFile = 'PackratMetadataFile.json';
                const buffer: Buffer = Buffer.from(JSON.stringify(this.sceneParameterHelper.metaDataFileJSON));

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
    // private async createSystemObjects(): Promise<H.IOResults> {
    //     const sceneSource: DBAPI.Scene | null = this.idScene ? await DBAPI.Scene.fetch(this.idScene) : null;
    //     if (!sceneSource)
    //         return this.logError(`createSystemObjects unable to compute source scene from id ${this.idScene}`);

    //     const sceneSystemObject: DBAPI.SystemObject | null = await sceneSource.fetchSystemObject();
    //     if (!sceneSystemObject)
    //         return this.logError(`createSystemObjects unable to fetch scene system object from ${JSON.stringify(sceneSource, H.Helpers.saferStringify)}`);

    //     const modelSource: DBAPI.Model | null = this.idModel ? await DBAPI.Model.fetch(this.idModel) : null;
    //     if (!modelSource)
    //         return this.logError(`createSystemObjects unable to compute source model from id ${this.idModel}`);

    //     const MSXSources: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromModelAndScene(modelSource.idModel, sceneSource.idScene);
    //     if (!MSXSources)
    //         return this.logError(`createSystemObjects unable to compute ModelSceneXrefs from idModel ${this.idModel}, idScene ${this.idScene}`);

    //     const vModelGeometryFile: DBAPI.Vocabulary | undefined = await this.computeVocabModelGeometryFile();
    //     if (!vModelGeometryFile)
    //         return this.logError('createSystemObjects unable to calculate vocabulary needed to ingest generated downloads');

    //     // Retrieve generated files
    //     let downloadMap: Map<string, string> = new Map<string, string>(); // map from download type -> download filename
    //     try {
    //         downloadMap = await JobCookSIGenerateDownloadsOutput.extractDownloads(JSON.parse(this._dbJobRun.Output || ''));
    //     } catch (err) {
    //         const error: string = 'JobCookSIGenerateDownloadsOutput.extractDownloads failed';
    //         LOG.error('JobCookSIGenerateDownloadsOutput.extractDownloads failed', LOG.LS.eJOB, err);
    //         return { success: false, error };
    //     }
    //     LOG.info(`JobCookSIGenerateDownloads extracted download files ${JSON.stringify(downloadMap, H.Helpers.saferStringify)}`, LOG.LS.eJOB);

    //     // record updated asset -> asset version, for use in rolling a new SystemObjectVersion for the scene
    //     const assetVersionOverrideMap: Map<number, number> = new Map<number, number>();
    //     const LS: LocalStore = await ASL.getOrCreateStore();
    //     const idUserCreator: number = LS?.idUser ?? 0;

    //     for (const [downloadType, downloadFile] of downloadMap) {
    //         LOG.info(`JobCookSIGenerateDownloads processing download ${downloadFile} of type ${downloadType}`, LOG.LS.eJOB);
    //         const RSR: STORE.ReadStreamResult = await this.fetchFile(downloadFile);
    //         if (!RSR.success || !RSR.readStream)
    //             return this.logError(`createSystemObjects unable to fetch stream for generated download ${downloadFile}: ${RSR.error}`);

    //         // look for existing model, a child object of modelSource, with the matching downloadType
    //         let model: DBAPI.Model | null = await this.findMatchingModelFromModel(modelSource, downloadType);
    //         let modelSO: DBAPI.SystemObject | null = null;
    //         let Asset: DBAPI.Asset | null = null;

    //         if (model) {
    //             // if we already have a model, look for the asset that we are likely updating:
    //             modelSO = await model.fetchSystemObject();
    //             if (modelSO) {
    //                 const modelAssets: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromSystemObject(modelSO.idSystemObject);
    //                 if (modelAssets) {
    //                     for (const modelAsset of modelAssets) {
    //                         if (modelAsset.FileName === downloadFile) {
    //                             Asset = modelAsset;
    //                             break;
    //                         }
    //                     }
    //                 } else
    //                     LOG.error(`JobCookSIGenerateDownloads.createSystemObjects unable to fetch assets for model systemobject ${JSON.stringify(modelSO, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
    //             } else
    //                 LOG.error(`JobCookSIGenerateDownloads.createSystemObjects unable to fetch system object for ${JSON.stringify(modelSource, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
    //         } else {
    //             // create Model (for each download generated)
    //             model = await this.createModel(downloadFile, downloadType, modelSource);
    //             if (!await model.create())
    //                 return this.logError(`createSystemObjects unable to create model ${JSON.stringify(model, H.Helpers.saferStringify)}`);

    //             // link each model as derived from both the scene and the master model
    //             const SOX1: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(sceneSource, model);
    //             if (!SOX1)
    //                 return this.logError(`createSystemObjects unable to wire Scene ${JSON.stringify(sceneSource, H.Helpers.saferStringify)} and Model ${JSON.stringify(model, H.Helpers.saferStringify)} together`);

    //             const SOX2: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, model);
    //             if (!SOX2)
    //                 return this.logError(`createSystemObjects unable to wire Model Source ${JSON.stringify(modelSource, H.Helpers.saferStringify)} and Model ${JSON.stringify(model, H.Helpers.saferStringify)} together`);
    //         }

    //         // ingest model assets, and associate them with the correct model
    //         const ISI: STORE.IngestStreamOrFileInput = {
    //             readStream: RSR.readStream,
    //             localFilePath: null,
    //             asset: Asset,
    //             FileName: downloadFile,
    //             FilePath: '',
    //             idAssetGroup: 0,
    //             idVAssetType: vModelGeometryFile.idVocabulary,
    //             allowZipCracking: false,
    //             idUserCreator,
    //             SOBased: model,
    //             Comment: 'Created by Cook si-generate-downloads',
    //             doNotUpdateParentVersion: true // we create a new system object version below
    //         };

    //         LOG.info(`JobCookSIGenerateDownloads.createSystemObjects ingesting ${downloadFile}`, LOG.LS.eJOB);
    //         const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
    //         if (!IAR.success) {
    //             await this.appendToReportAndLog(`${this.name()} unable to ingest generated download model ${downloadFile}: ${IAR.error}`, true);
    //             continue;
    //             // return { success: false, error: ISR.error };
    //         }
    //         if (IAR.assetVersions && IAR.assetVersions.length > 1)
    //             LOG.error(`JobCookSIGenerateDownloads.createSystemObjects created multiple asset versions, unexpectedly, ingesting ${downloadFile}`, LOG.LS.eJOB);

    //         let idSystemObjectModel: number | null = modelSO ? modelSO.idSystemObject : null;
    //         if (!idSystemObjectModel) {
    //             const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromModel(model);
    //             idSystemObjectModel = SOI ? SOI.idSystemObject : null;
    //         }
    //         const assetVersion: DBAPI.AssetVersion | null = (IAR.assetVersions && IAR.assetVersions.length > 0) ? IAR.assetVersions[0] : null;
    //         const pathObject: string = idSystemObjectModel ? RouteBuilder.RepositoryDetails(idSystemObjectModel, eHrefMode.ePrependClientURL) : '';
    //         const hrefObject: string = H.Helpers.computeHref(pathObject, model.Name);
    //         const pathDownload: string = assetVersion ? RouteBuilder.DownloadAssetVersion(assetVersion.idAssetVersion, eHrefMode.ePrependServerURL) : '';
    //         const hrefDownload: string = pathDownload ? ': ' + H.Helpers.computeHref(pathDownload, 'Download') : '';
    //         await this.appendToReportAndLog(`${this.name()} ingested generated download model ${hrefObject}${hrefDownload}`);

    //         if (assetVersion)
    //             assetVersionOverrideMap.set(assetVersion.idAsset, assetVersion.idAssetVersion);

    //         // create/update ModelSceneXref for each download generated ... do after ingest so that we have the storage size available
    //         const FileSize: bigint | null = assetVersion ? assetVersion.StorageSize : null;
    //         const MSXSource: DBAPI.ModelSceneXref | null = MSXSources.length > 0 ? MSXSources[0] : null;

    //         const MSXs: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromModelSceneAndName(model.idModel, sceneSource.idScene, model.Name);
    //         let MSX: DBAPI.ModelSceneXref | null = (MSXs && MSXs.length > 0) ? MSXs[0] : null;
    //         let MSXResult: boolean = false;
    //         if (MSX) {
    //             MSX.FileSize = FileSize;
    //             MSXResult = await MSX.update();
    //         } else {
    //             MSX = new DBAPI.ModelSceneXref({
    //                 idModelSceneXref: 0,
    //                 idModel: model.idModel,
    //                 idScene: sceneSource.idScene,
    //                 Name: model.Name,
    //                 Usage: `Download ${downloadType}`,
    //                 Quality: null,
    //                 FileSize,
    //                 UVResolution: null,
    //                 BoundingBoxP1X: MSXSource?.BoundingBoxP1X ?? null,
    //                 BoundingBoxP1Y: MSXSource?.BoundingBoxP1Y ?? null,
    //                 BoundingBoxP1Z: MSXSource?.BoundingBoxP1Z ?? null,
    //                 BoundingBoxP2X: MSXSource?.BoundingBoxP2X ?? null,
    //                 BoundingBoxP2Y: MSXSource?.BoundingBoxP2Y ?? null,
    //                 BoundingBoxP2Z: MSXSource?.BoundingBoxP2Z ?? null,
    //                 TS0: MSXSource?.TS0 ?? null,
    //                 TS1: MSXSource?.TS1 ?? null,
    //                 TS2: MSXSource?.TS2 ?? null,
    //                 R0: MSXSource?.R0 ?? null,
    //                 R1: MSXSource?.R1 ?? null,
    //                 R2: MSXSource?.R2 ?? null,
    //                 R3: MSXSource?.R3 ?? null,
    //                 S0: MSXSource?.S0 ?? null,
    //                 S1: MSXSource?.S1 ?? null,
    //                 S2: MSXSource?.S2 ?? null,
    //             });
    //             MSXResult = await MSX.create();
    //         }

    //         if (!MSXResult)
    //             return this.logError(`createSystemObjects unable to create/update ModelSceneXref ${JSON.stringify(MSX, H.Helpers.saferStringify)}`);

    //         // run si-packrat-inspect on this model
    //         if (idSystemObjectModel) {
    //             const results: H.IOResults = await WorkflowUtil.computeModelMetrics(model.Name, model.idModel, idSystemObjectModel, undefined, undefined,
    //                 undefined, undefined /* FIXME */, idUserCreator);
    //             if (results.success)
    //                 this.appendToReportAndLog(`JobCookSIGenerateDownloads extracted model metrics for ${model.Name}`);
    //             else if (results.error)
    //                 this.logError(results.error);
    //         }
    //     }

    //     // Clone scene's systemObjectVersion, using the assetVersionOverrideMap populated with new/updated assets
    //     const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(sceneSystemObject.idSystemObject, null,
    //         'Created by Cook si-generate-downloads', assetVersionOverrideMap);
    //     if (!SOV)
    //         return this.logError(`createSystemObjects unable to clone SystemObjectVersion for ${JSON.stringify(sceneSystemObject, H.Helpers.saferStringify)}`);

    //     // Add scene asset metadata for attachments
    //     // LOG.info('JobCookSIGenerateDownloads.createSystemObjects calling PublishScene.extractSceneMetadata', LOG.LS.eJOB);
    //     const metadataResult: H.IOResults = await PublishScene.extractSceneMetadata(sceneSystemObject.idSystemObject, LS?.idUser ?? null);
    //     if (!metadataResult.success)
    //         LOG.error(`JobCookSIGenerateDownloads.createSystemObjects unable to persist scene attachment metadata: ${metadataResult.error}`, LOG.LS.eJOB);

    //     return { success: true };
    // }
    private async createSystemObjects(): Promise<H.IOResults> {

        // grab our Packrat Scene from the database. idScene is a parameter passed in when creating this object
        const sceneSource: DBAPI.Scene | null = this.idScene ? await DBAPI.Scene.fetch(this.idScene) : null;
        if (!sceneSource)
            return this.logError(`createSystemObjects unable to compute source scene from id ${this.idScene}`);

        // grab the scene's SystemObject.
        const sceneSystemObject: DBAPI.SystemObject | null = await sceneSource.fetchSystemObject();
        if (!sceneSystemObject)
            return this.logError(`createSystemObjects unable to fetch scene system object from ${JSON.stringify(sceneSource, H.Helpers.saferStringify)}`);

        // grab our master model's source info
        const modelSource: DBAPI.Model | null = this.idModel ? await DBAPI.Model.fetch(this.idModel) : null;
        if (!modelSource)
            return this.logError(`createSystemObjects unable to compute source model from id ${this.idModel}`);

        // Retrieve generated files from Cook. Cook may return multiple types of objects (models, scenes, etc.)
        // map from download type -> download filename
        let downloadMap: Map<string, string> = new Map<string, string>();
        try {
            downloadMap = await JobCookSIGenerateDownloadsOutput.extractDownloads(JSON.parse(this._dbJobRun.Output || ''));
        } catch (err) {
            const error: string = 'JobCookSIGenerateDownloadsOutput.extractDownloads failed';
            LOG.error('JobCookSIGenerateDownloadsOutput.extractDownloads failed', LOG.LS.eJOB, err);
            return { success: false, error };
        }
        LOG.info(`JobCookSIGenerateDownloads extracted download files ${JSON.stringify(downloadMap, H.Helpers.saferStringify)}`, LOG.LS.eJOB);

        // if nothing returned then bail
        if(downloadMap.size<=0)
            return this.logError('JobCookSIGenerateDownloads did not receive any files to process. Cook error?');

        // array to handle accumulated errors/warning while processing files
        // returned as a string for further processing or display to user. (Q?)
        let svxSceneFile: FileProcessItem | null = null;
        const modelFiles: Array<FileProcessItem> = [];

        // record updated asset -> asset version, for use in rolling a new SystemObjectVersion for the scene
        const assetVersionOverrideMap: Map<number, number> = new Map<number, number>();
        const LS: LocalStore = await ASL.getOrCreateStore();
        const idUserCreator: number = LS?.idUser ?? 0;

        // cycle through retrieved downloads, processing them
        LOG.info(`JobCookSIGenerateDownloads processing ${downloadMap.size} generated downloads (idScene:${sceneSource.idScene})`,LOG.LS.eJOB);
        for (const [downloadType, downloadFile] of downloadMap) {

            // fetch the file from WebDav shared space with Cook
            // TODO: just check if file exists vs. actually opening stream
            LOG.info(`JobCookSIGenerateDownloads processing download ${downloadFile} of type ${downloadType}`, LOG.LS.eJOB);
            const RSR: STORE.ReadStreamResult = await this.fetchFile(downloadFile);
            if (!RSR.success || !RSR.readStream)
                return this.logError(`createSystemObjects unable to fetch stream for generated download ${downloadFile}: ${RSR.error}`);

            // build our item for tracking the file and push into our queue
            const currentItemResult: FileProcessItem = {
                downloadType,
                fileType: this.getFileTypeFromDownloadType(downloadType),
                fileName: downloadFile,
                success: true };

            // scenes get set aside for later processing since it must be done after models
            // while models are processed on the spot.
            switch(currentItemResult.fileType) {
                // if we're a scene file then grab actual data and store it
                case 'scene': {
                    // parse our scene file
                    const svx: SvxReader = new SvxReader();
                    const res: H.IOResults = await svx.loadFromStream(RSR.readStream);
                    if (!res.success || !svx.SvxExtraction)
                        return this.logError(`JobCookSIGenerateDownloads.createSystemObjects unable to parse scene file ${downloadFile}: ${res.error}`);

                    // store the results. skip additional scenes if any
                    currentItemResult.data = svx.SvxExtraction;
                    if(svxSceneFile != null)
                        this.logError(`JobCookSIGenerateDownloads.createSystemObjects detected multiple scene files in Cook response (idScene: ${sceneSource.idScene} | file: ${downloadFile})`);
                    svxSceneFile = currentItemResult;
                    continue;
                }

                // models we process in place ingesting into the system and storing the MSX for later use
                case 'model': {
                    const modelProcessingResult = await this.processModelFile(sceneSource,modelSource,currentItemResult,RSR,idUserCreator);
                    if(!modelProcessingResult) {
                        // store our info with an error, add to our report, and break out of loop (no point checking other files)
                        modelFiles.push({ ...currentItemResult, success: false, error: `error processing model '${downloadFile}'` });
                        await this.appendToReportAndLog(`JobCookSIGenerateDownloads failed model file: ${downloadFile}`);
                        break;
                    }

                    // if we have success, extract our overrides and ModelScenXref so we can link this up to the right resources
                    const { assetVersionOverrideMap: assetVersionOverrides, MSX } = modelProcessingResult;
                    currentItemResult.data = { assetVersionOverrides, MSX };
                    modelFiles.push(currentItemResult);
                    // LOG.info(`>>> model file results: ${H.Helpers.JSONStringify(currentItemResult)}`,LOG.LS.eDEBUG);

                    // need to finish all models and the scene before linking up to the Scene so they connect
                    // to the correct versions. So we combine our asset overrides for later handling.
                    // LOG.info(`>>> model (${downloadFile}) assetVersionOverrideMap: ${H.Helpers.JSONStringify(assetVersionOverrideMap)}`,LOG.LS.eDEBUG);
                    assetVersionOverrides.forEach((value, key) => { assetVersionOverrideMap.set(key, value); });

                } break;
            }
        }

        // if we don't have a scene file, then we bail
        // TODO: cleanup ingested models on failure
        if(!svxSceneFile || svxSceneFile.success===false)
            return await this.appendToReportAndLog(`JobCookSIGenerateDownloads failed processing of returned download files (${H.Helpers.JSONStringify(svxSceneFile)})`,true);

        // if we had errors processing models, then we bail
        // TODO: rollback to previous versions of all models that were successful on failure (i.e. cleanup)
        const hasValidModels: boolean = !modelFiles.some(obj => obj.success === false);
        if( hasValidModels === false) {
            const errors = `["${
                modelFiles.filter(obj => obj.success === false).map(obj => obj.error).join('","')
            }"]`;
            return await this.appendToReportAndLog(`JobCookSIGenerateDownloads failed processing of returned download model files (name: ${sceneSource.Name} | idScene: ${sceneSource.idScene} | errors: ${errors})`,true);
        }

        // update all ModelSceneXrefs transforms for generated models in the svx scene with what's in the
        // scene to ensure the DB matches. this is done to ensure a match when comparing downstream
        // Cook/Voyager is assumed to be source of truth.
        for(const model of modelFiles) {

            // find modelDetails from scene
            const svxModelDetails = svxSceneFile.data.modelDetails.find(svxModel => svxModel.Name === model.fileName);
            // LOG.info(`>>> found matching model for MSX update (${model.fileName}): ${H.Helpers.JSONStringify(svxModelDetails)}`, LOG.LS.eDEBUG);

            if(svxModelDetails) {

                // make sure we have a MSX to work with
                const MSX: DBAPI.ModelSceneXref = model.data?.MSX ?? null;
                if(!MSX) {
                    LOG.error(`JobCookSIGenerateDownloads cannot update MSX for model (${model.fileName}). invalid input. no MSX found`,LOG.LS.eJOB);
                    continue;
                }

                // overwrite what is currently stored in the transform. assuming Cook
                // is the source of truth.
                MSX.BoundingBoxP1X = svxModelDetails.BoundingBoxP1X;
                MSX.BoundingBoxP1Y = svxModelDetails.BoundingBoxP1Y;
                MSX.BoundingBoxP1Z = svxModelDetails.BoundingBoxP1Z;
                MSX.BoundingBoxP2X = svxModelDetails.BoundingBoxP2X;
                MSX.BoundingBoxP2Y = svxModelDetails.BoundingBoxP2Y;
                MSX.BoundingBoxP2Z = svxModelDetails.BoundingBoxP2Z;
                MSX.TS0 = svxModelDetails.TS0;
                MSX.TS1 = svxModelDetails.TS1;
                MSX.TS2 = svxModelDetails.TS2;
                MSX.R0 = svxModelDetails.R0;
                MSX.R1 = svxModelDetails.R1;
                MSX.R2 = svxModelDetails.R2;
                MSX.R3 = svxModelDetails.R3;
                MSX.S0 = svxModelDetails.S0;
                MSX.S1 = svxModelDetails.S1;
                MSX.S2 = svxModelDetails.S2;

                // TODO: check if other properties like usage differ
                const MSXResult: boolean = await MSX.update();
                if(!MSXResult)
                    LOG.error(`JobCookSIGenerateDownloads cannot update MSX for model (${model.data.MSX.Name})`,LOG.LS.eJOB);
            } else
                LOG.info(`JobCookSIGenerateDownloads skipping generated download model (${model.fileName}). assuming not referenced by scene (idScene:${sceneSource.idScene}).`,LOG.LS.eJOB);
        }

        LOG.info('========================================== process scene ==================================================',LOG.LS.eDEBUG);
        // process the scene file, ingesting it
        const result = await this.processSceneFile(modelSource, svxSceneFile, idUserCreator);
        if(result.success===false)
            await this.appendToReportAndLog(`JobCookSIGenerateDownloads failed to process svx scene (${result.error})`);
        else
            await this.appendToReportAndLog(`JobCookSIGenerateDownloads successful processing of svx scene: ${svxSceneFile.fileName}`);

        LOG.info('========================================== cleanup ==================================================',LOG.LS.eDEBUG);
        LOG.info(`>>> modelFiles: ${H.Helpers.JSONStringify(modelFiles)}`,LOG.LS.eDEBUG);
        LOG.info(`>>> sceneFile: ${H.Helpers.JSONStringify(svxSceneFile)}`,LOG.LS.eDEBUG);

        // link the models and assets to this Packrat Scene
        // Clone scene's systemObjectVersion, using the assetVersionOverrideMap populated with new/updated assets
        const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(sceneSystemObject.idSystemObject, null,
            'Created by Cook si-generate-downloads', assetVersionOverrideMap);
        if (!SOV)
            return this.logError(`JobCookSIGenerateDownloads.createSystemObjects unable to clone SystemObjectVersion for ${JSON.stringify(sceneSystemObject, H.Helpers.saferStringify)}`);

        // Add scene asset metadata for attachments
        // LOG.info('JobCookSIGenerateDownloads.createSystemObjects calling PublishScene.extractSceneMetadata', LOG.LS.eJOB);
        const metadataResult: H.IOResults = await PublishScene.extractSceneMetadata(sceneSystemObject.idSystemObject, LS?.idUser ?? null);
        LOG.info(`>>> scene asset metadata: ${H.Helpers.JSONStringify(metadataResult)}`,LOG.LS.eDEBUG);
        if (!metadataResult.success)
            return this.logError(`JobCookSIGenerateDownloads.createSystemObjects unable to persist scene attachment metadata: ${metadataResult.error}`);

        return { success: true };
    }
    // #endregion

    protected async getParameters(): Promise<JobCookSIGenerateDownloadsParameters> {
        const params: JobCookSIGenerateDownloadsParameters = { ...this.parameters };
        delete params.idModel;
        delete params.idScene;
        delete params.units;
        delete params.metaDataFile;
        delete params.parameterHelper;
        return params;
    }

    private async computeVocabDownload(): Promise<DBAPI.Vocabulary | undefined> {
        if (!JobCookSIGenerateDownloads.vocabDownload) {
            JobCookSIGenerateDownloads.vocabDownload = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeDownload);
            if (!JobCookSIGenerateDownloads.vocabDownload)
                LOG.error('JobCookSIGenerateDownloads unable to fetch vocabulary for Download Model Purpose', LOG.LS.eGQL);
        }
        return JobCookSIGenerateDownloads.vocabDownload;
    }

    // private validFileExtensions = ['usdz','obj','fbx','ply','glb', 'svx', 'zip'];
    private validDownloadTypes = [
        'objZipFull',
        'objZipLow',
        'gltfZipLow',
        'usdz',
        'webAssetGlbARCompressed',
        'webAssetGlbLowUncompressed',
        'scene_document'
    ];

    private getFileTypeFromDownloadType(downloadType: string) {

        if(this.validDownloadTypes.includes(downloadType)==false) { return ''; }

        switch(downloadType) {
            case 'objZipFull':
            case 'objZipLow':
            case 'gltfZipLow':
            case 'usdz':
            case 'webAssetGlbARCompressed':
            case 'webAssetGlbLowUncompressed':
                return 'model';

            case 'scene_document':
                return 'scene';

            default:
                return '';
        }

        // const extension = path.slice((Math.max(0, path.lastIndexOf('.')) || Infinity) + 1);

        // LOG.info(`>>> extract: ${path} | ${extension}`);
        // if(extension.length <= 0 || extension === '') { return ''; }
        // if(this.validFileExtensions.includes(extension)==false) { return ''; }

        // switch(extension){
        //     case 'zip':
        //     case 'usdz':
        //     case 'glb':
        //     case 'fbx':
        //     case 'ply':
        //     case 'obj': { return 'model'; }

        //     case 'vxs': { return 'scene'; }

        //     default: { return ''; }
        // }
    }

    private logError(errorMessage: string): H.IOResults {
        // const error: string = `JobCookSIGenerateDownloads.${errorMessage}`;
        LOG.error(errorMessage, LOG.LS.eJOB);
        return { success: false, error: errorMessage };
    }

    //------------------------------------------------------------------------------
    // MODEL
    //------------------------------------------------------------------------------
    // #region model
    private async processModelFile(sceneSource: DBAPI.Scene, modelSource: DBAPI.Model, fileItem: FileProcessItem, RSR: STORE.ReadStreamResult, idUserCreator: number ): Promise<{ assetVersionOverrideMap: Map< number, number>, MSX: DBAPI.ModelSceneXref } | null> { //Promise<H.IOResults> {

        // verify input
        if(!sceneSource || fileItem.fileName.length<=0 || idUserCreator < 0 || RSR == null) {
            this.logError(`JobCookSIGenerateDownloads.processModelFile invalid parameters passed for ${fileItem.fileName}`);
            return null;
        }

        // grab our ModelSceneXref from the database for the master model <> scene.
        // This is used for defaults linking the model to a Scene in the even that one doesn't already exist
        const MSXSources: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromModelAndScene(modelSource.idModel, sceneSource.idScene);
        if (!MSXSources) {
            this.logError(`JobCookSIGenerateDownloads.processModelFile createSystemObjects unable to compute ModelSceneXrefs from idModel ${this.idModel}, idScene ${this.idScene}`);
            return null;
        }
        const MSXSource: DBAPI.ModelSceneXref | null = MSXSources.length > 0 ? MSXSources[0] : null;
        // LOG.info(`>>> processModelFile ModelSceneXref.MSXSource: ${H.Helpers.JSONStringify(MSXSource)}`,LOG.LS.eDEBUG);

        // determine the vocabulary needed for ingestion. vocabulary is used for...
        const vModelGeometryFile: DBAPI.Vocabulary | undefined = await this.computeVocabModelGeometryFile();
        if (!vModelGeometryFile) {
            this.logError('JobCookSIGenerateDownloads.processModelFile createSystemObjects unable to calculate vocabulary needed to ingest generated downloads');
            return null;
        }

        // look for existing model, a child object of the master model (modelSource), with the matching downloadType
        let model: DBAPI.Model | null = await this.findMatchingModelFromModel(modelSource, fileItem.downloadType);
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
                        if (modelAsset.FileName === fileItem.fileName) {
                            Asset = modelAsset;
                            break;
                        }
                    }
                } else {
                    const name = JSON.stringify(modelSO, H.Helpers.saferStringify);
                    this.logError(`unable to fetch assets for model system object ${name}`);
                    return null;
                }
            } else {
                const name = JSON.stringify(modelSource, H.Helpers.saferStringify);
                this.logError(`unable to fetch system object ${name}`);
                return null;
            }
        } else {
            // create Model (for each download generated)
            model = await this.createModel(fileItem.fileName, fileItem.downloadType, modelSource);
            if (!await model.create()) {
                const name = JSON.stringify(model, H.Helpers.saferStringify);
                this.logError(`JobCookSIGenerateDownloads.processModelFile unable to create model: ${name}`);
                return null;
            }

            // link model as derived from the scene
            const SOX1: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(sceneSource, model);
            if (!SOX1) {
                this.logError(`JobCookSIGenerateDownloads.processModelFile unable to wire model to scene: ${JSON.stringify(sceneSource, H.Helpers.saferStringify)} and Model ${JSON.stringify(model, H.Helpers.saferStringify)} together`);
                return null;
            }

            // link model as derived from the master model
            const SOX2: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, model);
            if (!SOX2) {
                this.logError(`JobCookSIGenerateDownloads.processModelFile unable to wire model to master model source: ${JSON.stringify(modelSource, H.Helpers.saferStringify)} and Model ${JSON.stringify(model, H.Helpers.saferStringify)} together`);
                return null;
            }
        }

        // ingest model assets, and associate them with the correct model
        const ISI: STORE.IngestStreamOrFileInput = {
            readStream: RSR.readStream,
            localFilePath: null,
            asset: Asset,
            FileName: fileItem.fileName,
            FilePath: '',
            idAssetGroup: 0,
            idVAssetType: vModelGeometryFile.idVocabulary,
            allowZipCracking: false,
            idUserCreator,
            SOBased: model,
            Comment: 'Created by Cook si-generate-downloads',
            doNotUpdateParentVersion: true // we create a new system object version below
        };

        // ingest model...
        LOG.info(`JobCookSIGenerateDownloads.processModelFile ingesting ${fileItem.fileName}`, LOG.LS.eJOB);
        const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        if (!IAR.success) {
            await this.appendToReportAndLog(`${this.name()} unable to ingest generated download model ${fileItem.fileName}: ${IAR.error}`, true);
            return null;
        }

        // check for multiple asset versions
        // Q: what problem(s) does this cause?
        if (IAR.assetVersions && IAR.assetVersions.length > 1)
            this.logError(`JobCookSIGenerateDownloads.processModelFile created multiple asset versions, unexpectedly, ingesting ${fileItem.fileName}`);

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
        const assetVersionOverrideMap: Map< number, number> = new Map<number, number>();
        if (assetVersion)
            assetVersionOverrideMap.set(assetVersion.idAsset, assetVersion.idAssetVersion);

        // create/update ModelSceneXref for each download generated ... do after ingest so that we have the storage size available
        const FileSize: bigint | null = assetVersion ? assetVersion.StorageSize : null;

        // get our ModelSceneXref from the model id, scene id, and objects name in the DB
        const MSXs: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromModelSceneAndName(model.idModel, sceneSource.idScene, model.Name);
        LOG.info(`>>> processingModelFile current file (${model.Name}) ModelSceneXrefs: ${H.Helpers.JSONStringify(MSXs)}`,LOG.LS.eDEBUG);

        // if we didn't get one then we create one. otherwise we use the first one
        let MSX: DBAPI.ModelSceneXref | null = (MSXs && MSXs.length > 0) ? MSXs[0] : null;
        let MSXResult: boolean = false;
        if (MSX) {
            // if we have a record already just update the filesize
            MSX.FileSize = FileSize;

            // update our DB record
            MSXResult = await MSX.update();
        } else {
            // if we don't have a record, create it
            const { usage, quality, uvResolution } = JobCookSIGenerateDownloads.computeModelPropertiesFromDownloadType(fileItem.downloadType);
            MSX = new DBAPI.ModelSceneXref({
                idModelSceneXref: 0,
                idModel: model.idModel,
                idScene: sceneSource.idScene,
                Name: model.Name,
                Usage: usage ?? null,
                Quality: quality ?? null, // null
                FileSize,
                UVResolution: uvResolution ?? null, // null

                // transform
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
        if (MSXResult === false) {
            this.logError(`JobCookSIGenerateDownloads.processModelFile cannot create/update ModelSceneXref ${JSON.stringify(MSX, H.Helpers.saferStringify)}`);
            return null;
        }

        // run si-packrat-inspect on this model to get the metrics and make sure it's valid
        console.time(`${model.Name} inspection`);
        if (idSystemObjectModel) {
            const results: H.IOResults = await WorkflowUtil.computeModelMetrics(model.Name, model.idModel, idSystemObjectModel, undefined, undefined,
                undefined, undefined /* FIXME */, idUserCreator);
            if (results.success)
                await this.appendToReportAndLog(`JobCookSIGenerateDownloads extracted model metrics for ${model.Name}`);
            else if (results.error) {
                // TODO: cleanup ingestion
                this.logError(`JobCookSIGenerateDownloads.processModelFile failed inspecting the model: ${model.Name} (${results.error})`);
                return null;
            }
        }
        console.timeEnd(`${model.Name} inspection`);

        return { assetVersionOverrideMap, MSX };
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
            CountMeshes: null, CountVertices: null, CountEmbeddedTextures: null, CountLinkedTextures: null, CountTriangles: null, // Note: moved triangles from end
            FileEncoding: null, IsDracoCompressed: null,

            // we try to assign best guess values when first created assuming they will be overwritten
            // by ModelSceneXref if the model has a scene reference.
            AutomationTag: JobCookSIGenerateDownloads.computeModelAutomationTagFromDownloadType(downloadType)
        });
    }

    public static computeModelPropertiesFromDownloadType(downloadType: string): { usage: string|undefined, quality: string|undefined, uvResolution: number|undefined } {

        // NOTE: caution if return types from Cook change
        switch(downloadType) {

            case 'objZipFull':
                return { usage: 'Download:'+downloadType, quality: 'Highest', uvResolution: 0 };

            case 'objZipLow':
            case 'gltfZipLow':
            case 'webAssetGlbLowUncompressed':
                return { usage: 'Download:'+downloadType, quality: 'Low', uvResolution: 4096 };

            // refers to: <baseName>-100k-2048_std_draco.glb
            case 'webAssetGlbARCompressed':
                return { usage: 'App3D', quality: 'AR', uvResolution: 2048 };

            case 'usdz':
                return { usage: 'iOSApp3D', quality: 'AR', uvResolution: 2048 };
        }

        LOG.error(`JobCookSIGenerateDownloads.computeModelPropertiesFromDownloadType unsupported downloadType: ${downloadType}`,LOG.LS.eJOB);
        return { usage: undefined, quality: undefined, uvResolution: undefined };
    }

    public static computeModelAutomationTagFromDownloadType(downloadType: string): string {

        const { usage, quality, uvResolution } = JobCookSIGenerateDownloads.computeModelPropertiesFromDownloadType(downloadType);
        if(!usage || !quality || !uvResolution)
            return `error-${downloadType}-null-null`;

        switch(downloadType) {
            // HACK: need to hardcode these because the model is created outside ModelScreneXref context
            // and doesn't have the needed Usage, Quality, and UVResolution details. skipping 'Usage'.
            case 'objZipFull':
            case 'objZipLow':
            case 'gltfZipLow':
            case 'webAssetGlbLowUncompressed':
                return `download-${downloadType}-${quality}-${uvResolution}`;

            // HACK: hardcoding these as well expecting them to be reassigned/overwritten by ModelSceneXref
            // MSX format is: `scene-${this.Usage}-${this.Quality}-${this.UVResolution}`
            case 'webAssetGlbARCompressed':
            case 'usdz':
                return `scene-${usage}-${quality}-${uvResolution}`;
        }

        LOG.error(`JobCookSIGenerateDownloads.computeModelAutomationTag unsupported downloadType: ${downloadType}`,LOG.LS.eJOB);
        return `unknown-${downloadType}`;
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
        const automationTag = JobCookSIGenerateDownloads.computeModelAutomationTagFromDownloadType(downloadType);
        const matches: DBAPI.Model[] | null = await DBAPI.Model.fetchChildrenModels(modelSource.idModel, null, automationTag);

        // LOG.info(`>>>> matching existing model with downloaded model (idModel:${modelSource.idModel} | tag:${automationTag})`,LOG.LS.eDEBUG);
        return matches && matches.length > 0 ? matches[0] : null;
    }
    // #endregion

    //------------------------------------------------------------------------------
    // SCENE
    //------------------------------------------------------------------------------
    // #region scene
    private async processSceneFile(modelSource: DBAPI.Model, fileItem: FileProcessItem, idUserCreator: number): Promise<H.IOResults> {

        if (!this.sceneParameterHelper)
            return this.logError('JobCookSIGenerateDownloads.processSceneFile called without needed parameters');

        const svxFile: string = fileItem.fileName; //this.parameters.svxFile ?? 'scene.svx.json';
        const svxData = fileItem.data;
        const vScene: DBAPI.Vocabulary | undefined = await this.computeVocabAssetTypeScene();
        const vModel: DBAPI.Vocabulary | undefined = await this.computeVocabAssetTypeModelGeometryFile();
        if (!vScene || !vModel)
            return this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to calculate vocabulary needed to ingest scene file ${svxFile}`);

        // // Retrieve svx.json data
        // let RSR: STORE.ReadStreamResult = await this.fetchFile(svxFile);
        // if (!RSR.success || !RSR.readStream)
        //     return this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to fetch stream for scene file ${svxFile}: ${RSR.error}`);

        // Parse Scene
        // const svx: SvxReader = new SvxReader();
        // const res: H.IOResults = await svx.loadFromStream(RSR.readStream);
        // if (!res.success || !svx.SvxExtraction)
        //     return this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to parse scene file ${svxFile}: ${res.error}`);

        LOG.info(`JobCookSIGenerateDownloads.processSceneFile[${svxFile}] parse scene`, LOG.LS.eJOB);
        LOG.info(`JobCookSIGenerateDownloads.processSceneFile fetched scene:${H.Helpers.JSONStringify(svxData)}`, LOG.LS.eJOB);

        // Look for an existing scene, which is a child of the master model (modelSource)
        // TODO: what if there are multiple?
        const scenes: DBAPI.Scene[] | null = await DBAPI.Scene.fetchChildrenScenes(modelSource.idModel);
        if (!scenes)
            return this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to fetch children scenes of master model ${modelSource.idModel}`);

        // if we have more than one scene see if there is a clear path to selecting one (i.e. one has EDAN id)
        // TODO: investigate why the system sometimes creates additional scenes
        if(scenes.length>1) {
            LOG.info(`JobCookSIGenerateDownloads.processSceneFile found multiple(${scenes.length}) scenes. pruning...`,LOG.LS.eJOB);

            // Filter the scenes that have EdanUUID and store the ids of removed scenes
            const scenesWithEdanUUID: DBAPI.Scene[] = [];
            const removedSceneIds: number[] = [];

            for (const scene of scenes) {
                if (scene.EdanUUID !== undefined && scene.EdanUUID !== '' && scene.EdanUUID !==null) {
                    scenesWithEdanUUID.push(scene);
                } else {
                    removedSceneIds.push(scene.idScene);
                }
            }

            // Check if there is only one scene with EdanUUID
            if (scenesWithEdanUUID.length === 1) {
                LOG.error(`JobCookSIGenerateDownloads.processSceneFile pruning found scene. Needs cleanup. (modelSource.idModel: ${modelSource.idModel} | omitted idScene: ${removedSceneIds.join(',')})`,LOG.LS.eJOB);
                scenes.length = 0;
                scenes.push(...scenesWithEdanUUID);
            } else {
                // If there are more than one, clear the removed IDs as no scene is removed
                removedSceneIds.length = 0;
                LOG.error(`JobCookSIGenerateDownloads.processSceneFile pruning returned multiple scenes (${scenesWithEdanUUID.length}). Needs cleanup. (modelSource.idModel: ${modelSource.idModel})`,LOG.LS.eJOB);
            }
        }

        LOG.info(`>>> matching scenes: ${H.Helpers.JSONStringify(scenes)}`,LOG.LS.eDEBUG);

        // if we have multiple valid scenes, bail
        if(scenes.length>1)
            return this.logError(`multiple valid scenes found (${scenes.length}). cannot find asset to update (idScene: ${fileItem.fileName})`);

        // If needed, create a new scene (if we have no scenes, or if we have multiple scenes, then create a new one);
        // If we have just one scene, before reusing it, see if the model names all match up
        let createScene: boolean = (scenes.length !== 1);
        if (!createScene && scenes.length > 0 && svxData.modelDetails) {

            // LOG.info(`>>> modelDetails: ${H.Helpers.JSONStringify(svx.SvxExtraction.modelDetails)}`);

            for (const MSX of svxData.modelDetails) {
                LOG.info(`>>> finding model match for: ${MSX.Name}`,LOG.LS.eDEBUG);
                if (MSX.Name) {
                    LOG.info(`>>> MSX: ${H.Helpers.JSONStringify(MSX)}`,LOG.LS.eDEBUG);
                    // look for existing models, children of our scene, that match this model's purpose
                    const model: DBAPI.Model | null = await this.findMatchingModelFromScene(scenes[0], MSX.computeModelAutomationTag());
                    // LOG.info(`>>> matching model from scene: ${H.Helpers.JSONStringify(model)}`);
                    if (!model || (model.Name !== MSX.Name)) {
                        LOG.info(`>>> no model match: ${model?.Name} <> ${MSX.Name}`,LOG.LS.eDEBUG);
                        createScene = true;
                        break;
                    } else {
                        LOG.info(`>>> found match for: ${MSX.Name}`,LOG.LS.eDEBUG);
                    }
                } else { LOG.error(`>>> no MSX: ${H.Helpers.JSONStringify(MSX)}`,LOG.LS.eDEBUG); }
            }
        }

        const scene: DBAPI.Scene = createScene ? svxData.extractScene() : scenes[0];
        LOG.info(`createScene: ${createScene}`,LOG.LS.eDEBUG);
        LOG.info(`scene: ${H.Helpers.JSONStringify(scene)}`,LOG.LS.eDEBUG);

        let asset: DBAPI.Asset | null = null;
        if (createScene) {
            LOG.info(`JobCookSIGenerateDownloads.processSceneFile creating a new scene (${scene.Name}|${scene.EdanUUID})`,LOG.LS.eJOB);

            // compute ItemParent of ModelSource
            scene.Name = this.sceneParameterHelper.sceneName;
            if (this.sceneParameterHelper.sceneTitle)
                scene.Title = this.sceneParameterHelper.sceneTitle;
            if (!await scene.create())
                return this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to create Scene file ${svxFile}: database error`);

            // wire ModelSource to Scene
            const SOX: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, scene);
            if (!SOX)
                return this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to wire Model Source ${JSON.stringify(modelSource, H.Helpers.saferStringify)} to Scene ${JSON.stringify(scene, H.Helpers.saferStringify)}: database error`);

            // wire ItemParent to Scene
            const OG: DBAPI.ObjectGraph = this.sceneParameterHelper.OG;
            if (OG.item && OG.item.length > 0) {
                const SOX2: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(OG.item[0], scene);
                if (!SOX2)
                    return this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to wire item ${JSON.stringify(OG.item[0], H.Helpers.saferStringify)} to Scene ${JSON.stringify(scene, H.Helpers.saferStringify)}: database error`);
            }
            // LOG.info(`JobCookSIGenerateDownloads.processSceneFile[${svxFile}] wire ModelSource to Scene: ${JSON.stringify(SOX, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eJOB);
        } else {
            LOG.info(`JobCookSIGenerateDownloads.processSceneFile updating existing scene (${scene.Name}|${scene.EdanUUID})`,LOG.LS.eJOB);

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
                    LOG.error(`JobCookSIGenerateDownloads.processSceneFile unable to fetch assets for scene systemobject ${JSON.stringify(sceneSO, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
            } else
                LOG.error(`JobCookSIGenerateDownloads.processSceneFile unable to fetch system object for ${JSON.stringify(scene, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
        }

        // Scene owns this ingested asset of the SVX File
        // Read file a second time ... cloneStream isn't available
        const RSR = await this.fetchFile(svxFile);
        if (!RSR.success || !RSR.readStream)
            return this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to fetch stream for scene file ${svxFile}: ${RSR.error}`);

        // create our configuration for ingesting this svx scene
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
            Comment: 'Created by Cook si-generate-downloads'
        };
        const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        if (!IAR.success)
            return this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to ingest scene file ${svxFile}: ${IAR.error}`);
        if (IAR.assetVersions && IAR.assetVersions.length > 1)
            LOG.error(`JobCookSIGenerateDownloads.processSceneFile created multiple asset versions, unexpectedly, ingesting ${svxFile}`, LOG.LS.eJOB);

        const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromScene(scene);
        const assetVersion: DBAPI.AssetVersion | null = (IAR.assetVersions && IAR.assetVersions.length > 0) ? IAR.assetVersions[0] : null;
        const pathObject: string = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
        const hrefObject: string = H.Helpers.computeHref(pathObject, scene.Name);
        const pathDownload: string = assetVersion ? RouteBuilder.DownloadAssetVersion(assetVersion.idAssetVersion, eHrefMode.ePrependServerURL) : '';
        const hrefDownload: string = pathDownload ? ': ' + H.Helpers.computeHref(pathDownload, 'Download') : '';
        await this.appendToReportAndLog(`${this.name()} ingested scene ${hrefObject}${hrefDownload}`);

        // // const SOV: DBAPI.SystemObjectVersion | null | undefined = IAR.systemObjectVersion; // SystemObjectVersion for updated 'scene', with new version of scene asset
        // // LOG.info(`JobCookSIGenerateDownloads.processSceneFile[${svxFile}] wire ingestStreamOrFile: ${JSON.stringify(ISI, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eJOB);

        // // Now extract (just) the models; per Jamie Cope 5/3/2021, each model has all textures embedded
        // // How do we create the Model objects here? We can ingest the assets, as above, but we need to connect them to the right objects
        // if (svx.SvxExtraction.modelDetails) {
        //     for (const MSX of svx.SvxExtraction.modelDetails) {
        //         if (MSX.Name) {
        //             // look for existing models, children of our scene, that match this model's purpose
        //             const model: DBAPI.Model | null = await this.findMatchingModelFromScene(scene, MSX.computeModelAutomationTag());
        //             let asset: DBAPI.Asset | null = null;

        //             if (model) {
        //                 // if we already have a model, look for the asset that we are likely updating:
        //                 const modelSO: DBAPI.SystemObject | null = await model.fetchSystemObject();
        //                 if (modelSO) {
        //                     const modelAssets: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromSystemObject(modelSO.idSystemObject);
        //                     if (modelAssets) {
        //                         for (const modelAsset of modelAssets) {
        //                             switch (await modelAsset.assetType()) {
        //                                 case COMMON.eVocabularyID.eAssetAssetTypeModel:
        //                                 case COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile:
        //                                     asset = modelAsset;
        //                                     break;
        //                             }

        //                             if (asset)
        //                                 break; // found the model
        //                         }
        //                     } else
        //                         LOG.error(`JobCookSIGenerateDownloads.processSceneFile unable to fetch assets for model systemobject ${JSON.stringify(modelSO, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
        //                 } else
        //                     LOG.error(`JobCookSIGenerateDownloads.processSceneFile unable to fetch system object for ${JSON.stringify(model, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
        //             } else { // create model and related records

        //                 LOG.info(`>>> ERROR: shouldn't be here because all models should already be ingested: ${H.Helpers.JSONStringify(modelSource)}`);
        //                 continue;

        //                 // model = await this.transformModelSceneXrefIntoModel(MSX, modelSource);
        //                 // if (!await model.create())
        //                 //     return this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to create Model from referenced model ${MSX.Name}: database error`);

        //                 // // wire ModelSource to Model
        //                 // const SOX1: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, model);
        //                 // if (!SOX1)
        //                 //     return this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to wire Model Source ${JSON.stringify(modelSource, H.Helpers.saferStringify)} to Model ${JSON.stringify(model, H.Helpers.saferStringify)}: database error`);

        //                 // // Create ModelSceneXref for new model and parent scene
        //                 // /* istanbul ignore else */
        //                 // if (!MSX.idModelSceneXref) { // should always be true
        //                 //     MSX.idModel = model.idModel;
        //                 //     MSX.idScene = scene.idScene;
        //                 //     LOG.info(`>>> MSX creation: ${H.Helpers.JSONStringify(MSX)}`);
        //                 //     if (!await MSX.create())
        //                 //         return this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to create ModelSceneXref for model xref ${JSON.stringify(MSX)}: database error`);
        //                 // } else
        //                 //     LOG.error(`JobCookSIGenerateDownloads.processSceneFile unexpected non-null ModelSceneXref for model xref ${JSON.stringify(MSX)}: database error`, LOG.LS.eJOB);

        //                 // const SOX2: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(scene, model);
        //                 // if (!SOX2)
        //                 //     return this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to wire Scene ${JSON.stringify(scene, H.Helpers.saferStringify)} and Model ${JSON.stringify(model, H.Helpers.saferStringify)} together: database error`);
        //             }

        //             // const RSRModel: STORE.ReadStreamResult = await this.fetchFile(MSX.Name);
        //             // if (!RSRModel.success || !RSRModel.readStream)
        //             //     return this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to fetch stream for model file ${MSX.Name}: ${RSRModel.error}`);

        //             // const FileName: string = path.basename(MSX.Name);
        //             // const FilePath: string = path.dirname(MSX.Name);
        //             // const ISIModel: STORE.IngestStreamOrFileInput = {
        //             //     readStream: RSRModel.readStream,
        //             //     localFilePath: null,
        //             //     asset,
        //             //     FileName,
        //             //     FilePath,
        //             //     idAssetGroup: 0,
        //             //     idVAssetType: vModel.idVocabulary,
        //             //     allowZipCracking: false,
        //             //     idUserCreator,
        //             //     SOBased: model,
        //             //     Comment: 'Created by Cook si-generate-downloads',
        //             //     doNotUpdateParentVersion: true // if needed, we update the existing system object version below
        //             // };
        //             // IAR = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISIModel);
        //             // if (!IAR.success)
        //             //     return this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to ingest model file ${MSX.Name}: ${IAR.error}`);
        //             // if (IAR.assetVersions && IAR.assetVersions.length > 1)
        //             //     LOG.error(`JobCookSIGenerateDownloads.processSceneFile created multiple asset versions, unexpectedly, ingesting ${MSX.Name}`, LOG.LS.eJOB);

        //             // const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromModel(model);
        //             // const assetVersion: DBAPI.AssetVersion | null = (IAR.assetVersions && IAR.assetVersions.length > 0) ? IAR.assetVersions[0] : null;
        //             // const pathObject: string = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
        //             // const hrefObject: string = H.Helpers.computeHref(pathObject, model.Name);
        //             // const pathDownload: string = assetVersion ? RouteBuilder.DownloadAssetVersion(assetVersion.idAssetVersion, eHrefMode.ePrependServerURL) : '';
        //             // const hrefDownload: string = pathDownload ? ': ' + H.Helpers.computeHref(pathDownload, 'Download') : '';
        //             // await this.appendToReportAndLog(`${this.name()} ingested model ${hrefObject}${hrefDownload}`);

        //             // if an asset version was created for ingestion of this model, and if a system object version was created for scene ingestion,
        //             // associate the asset version with the scene's system object version (enabling a scene package to be downloaded, even if some assets
        //             // are owned by the ingested models). Note that if we *updated* models, we will be update the original models'
        //             // SystemObjectVersionAssetVersionXref with records pointing to the new model asset versions
        //             // if (SOV && assetVersion) {
        //             //     const SOVAVX: DBAPI.SystemObjectVersionAssetVersionXref | null =
        //             //         await DBAPI.SystemObjectVersionAssetVersionXref.addOrUpdate(SOV.idSystemObjectVersion, assetVersion.idAsset, assetVersion.idAssetVersion);
        //             //     if (!SOVAVX)
        //             //         LOG.error(`JobCookSIGenerateDownloads.processSceneFile unable create/update SystemObjectVersionAssetVersionXref for ${JSON.stringify(SOV, H.Helpers.saferStringify)}, ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
        //             // }

        //             // run si-packrat-inspect on this model
        //             // const results: H.IOResults = await WorkflowUtil.computeModelMetrics(FileName, model.idModel, undefined, undefined, undefined,
        //             //     undefined, undefined /* FIXME */, idUserCreator);
        //             // if (results.success)
        //             //     await this.appendToReportAndLog(`JobCookSIGenerateDownloads extracted model metrics for ${FileName}`);
        //             // else if (results.error)
        //             //     this.logError(results.error);
        //         } else
        //             LOG.error(`JobCookSIGenerateDownloads.processSceneFile skipping unnamed model ${JSON.stringify(MSX)}`, LOG.LS.eJOB);
        //     }
        // }

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
        LOG.info(`>>>> matching model from scene: ${sceneSource.idScene} | ${automationTag}`,LOG.LS.eDEBUG);
        const matches: DBAPI.Model[] | null = await DBAPI.Model.fetchChildrenModels(null, sceneSource.idScene, automationTag);

        // if(!matches || matches.length <= 0)
        //     LOG.info(`>>>> no matches found: ${sceneSource.idScene} | ${automationTag}`);

        // LOG.info(`>>>> findMatchingModelFromScene: ${H.Helpers.JSONStringify(matches)}`);
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

    // private async getModelDetailsFromVoyagerScene(svxFile): Promise<DBAPI.ModelSceneXref[] | null> {
    //     // Retrieve svx.json data
    //     const RSR: STORE.ReadStreamResult = await this.fetchFile(svxFile);
    //     if (!RSR.success || !RSR.readStream) {
    //         this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to fetch stream for scene file ${svxFile}: ${RSR.error}`);
    //         return null;
    //     }

    //     // Parse Scene
    //     const svx: SvxReader = new SvxReader();
    //     const res: H.IOResults = await svx.loadFromStream(RSR.readStream);
    //     if (!res.success || !svx.SvxExtraction) {
    //         this.logError(`JobCookSIGenerateDownloads.processSceneFile unable to parse scene file ${svxFile}: ${res.error}`);
    //         return null;
    //     }

    //     // return result
    //     return svx.SvxExtraction.modelDetails;
    // }
    // #endregion
}
