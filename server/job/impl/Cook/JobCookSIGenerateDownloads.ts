/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import { JobCook } from './JobCook';
import { CookRecipe } from './CookRecipe';
import { Config } from '../../../config';

import * as JOB from '../../interface';
import { WorkflowUtil } from '../../../workflow/impl/Packrat/WorkflowUtil';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as STORE from '../../../storage/interface';
import * as REP from '../../../report/interface';
import * as H from '../../../utils/helpers';
import { PublishScene } from '../../../collections/impl/PublishScene';
import { ASL, LocalStore } from '../../../utils/localStore';
import { RouteBuilder, eHrefMode } from '../../../http/routes/routeBuilder';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

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
                const buffer: Buffer = Buffer.from(H.Helpers.JSONStringify(this.sceneParameterHelper.metaDataFileJSON));

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
            if(results.success==false)
                this.recordFailure(null,results.error);
            else
                await this.appendToReportAndLog(`${this.name()} succeeded`, false);
            return results;
        } catch (error) {
            return this.logError('cleanup job failed',H.Helpers.getErrorString(error),undefined,false);
            return { success: false, error: H.Helpers.JSONStringify(error) };
        }
    }

    private async createSystemObjects(): Promise<H.IOResults> {
        // grab our Packrat Scene from the database. idScene is a parameter passed in when creating this object

        // grab our Packrat Scene from the database. idScene is a parameter passed in when creating this object
        const sceneSource: DBAPI.Scene | null = this.idScene ? await DBAPI.Scene.fetch(this.idScene) : null;
        if (!sceneSource)
            return this.logError('create system objects failed','unable to compute source scene from id', { idScene: this.idScene });

        // grab the scene's SystemObject.
        const sceneSystemObject: DBAPI.SystemObject | null = await sceneSource.fetchSystemObject();
        if (!sceneSystemObject)
            return this.logError('create system objects failed','unable to fetch scene system object', { sceneSource });

        // grab our master model's source info
        const modelSource: DBAPI.Model | null = this.idModel ? await DBAPI.Model.fetch(this.idModel) : null;
        if (!modelSource)
            return this.logError('create system objects failed','unable to compute source model from id', { idModel: this.idModel });

        // Retrieve generated files from Cook. Cook may return multiple types of objects (models, scenes, etc.)
        // map from download type -> download filename
        let downloadMap: Map<string, string> = new Map<string, string>();
        try {
            downloadMap = await JobCookSIGenerateDownloadsOutput.extractDownloads(JSON.parse(this._dbJobRun.Output || ''));
        } catch (err) {
            return this.logError('create system objects failed',H.Helpers.getErrorString(err), { idModel: this.idModel });
        }

        RK.logDebug(RK.LogSection.eJOB,'create system objects','extracted download files', { downloadMap },'Job.GenerateDownloads');

        // if nothing returned then bail
        if(downloadMap.size<=0)
            return this.logError('create system objects failed','did not receive any files to process. Cook error?',{});

        // verify the downloads/files we received from Cook are compatible with the current Packrat representation.
        // we do this to avoid issues where incoming Cook assets differ causing a new object be created.
        const verifyDataResult: H.IOResults = await this.verifyIncomingCookData(sceneSource, downloadMap);
        if(verifyDataResult.success == false)
            return this.logError('create system objects failed','incoming Cook data is not valid. Cannot generate downloads.',{});

        // array to handle accumulated errors/warning while processing files
        // returned as a string for further processing or display to user. (Q?)
        let svxSceneFile: FileProcessItem | null = null;
        const modelFiles: Array<FileProcessItem> = [];

        // record updated asset -> asset version, for use in rolling a new SystemObjectVersion for the scene
        const assetVersionOverrideMap: Map<number, number> = new Map<number, number>();
        const LS: LocalStore = await ASL.getOrCreateStore();
        const idUserCreator: number = LS?.idUser ?? 0;

        // cycle through retrieved downloads, processing them
        RK.logDebug(RK.LogSection.eJOB,'create system objects','procesing generated downloads', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, numDownloads: downloadMap.size },'Job.GenerateDownloads');

        for (const [downloadType, downloadFile] of downloadMap) {

            // fetch the file from WebDav shared space with Cook
            // TODO: just check if file exists vs. actually opening stream

            // fetch the file from WebDav shared space with Cook
            // TODO: just check if file exists vs. actually opening stream
            RK.logDebug(RK.LogSection.eJOB,'create system objects','processing download', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, downloadFile, downloadType },'Job.GenerateDownloads');

            const RSR: STORE.ReadStreamResult = await this.fetchFile(downloadFile);
            if (!RSR.success || !RSR.readStream)
                return this.logError('create system objects failed',`unable to fetch stream for generated download: ${RSR.error}`,{ downloadFile });

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
                        return this.logError('create system objects failed',`unable to parse scene file ${downloadFile}: ${res.error}`,{ downloadFile });

                    // store the results. skip additional scenes if any
                    currentItemResult.data = svx.SvxExtraction;
                    if(svxSceneFile != null)
                        await this.logError('create system objects failed','detected multiple scene files in Cook response', { idScene: sceneSource.idScene, downloadFile });
                    svxSceneFile = currentItemResult;
                    continue;
                }

                // models we process in place ingesting into the system and storing the MSX for later use
                case 'model': {
                    const modelProcessingResult = await this.processModelFile(sceneSource,modelSource,currentItemResult,RSR,idUserCreator);
                    if(!modelProcessingResult) {
                        // store our info with an error, add to our report, and break out of loop (no point checking other files)
                        modelFiles.push({ ...currentItemResult, success: false, error: `error processing model '${downloadFile}'` });
                        RK.logError(RK.LogSection.eJOB,'create system objects failed','failed to process model file', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, downloadFile },'Job.GenerateDownloads');
                        await this.appendToReportAndLog(`JobCookSIGenerateDownloads failed model file: ${downloadFile}`);
                        break;
                    }

                    // if we have success, extract our overrides and ModelScenXref so we can link this up to the right resources
                    const { assetVersionOverrideMap: assetVersionOverrides, MSX, assetVersion } = modelProcessingResult;
                    currentItemResult.data = { assetVersionOverrides, MSX, assetVersion };
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
            return this.logError('create system objects failed','failed processing of returned download files', { svxSceneFile });

        // if we had errors processing models, then we bail
        // TODO: rollback to previous versions of all models that were successful on failure (i.e. cleanup)
        const hasValidModels: boolean = !modelFiles.some(obj => obj.success === false);
        if( hasValidModels === false) {
            const errors = `["${
                modelFiles.filter(obj => obj.success === false).map(obj => obj.error).join('","')
            }"]`;
            return this.logError('create system objects failed','failed processing of returned download model files', { name: sceneSource.Name, idScene: sceneSource.idScene, errors });
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
                    RK.logError(RK.LogSection.eJOB,'create system objects failed','cannot update MSX for model. invalid input. no MSX found', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, ...model },'Job.GenerateDownloads');
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
                    RK.logError(RK.LogSection.eJOB,'create system objects','cannot update MSX for model', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, modelName: model.data.MSX.Name },'Job.GenerateDownloads');
            } else
                RK.logWarning(RK.LogSection.eJOB,'create system objects','skipping generated download model. assuming not referenced by scene',
                    { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, model, idScene: sceneSource.idScene },'Job.GenerateDownloads');
        }

        // process the scene file, ingesting it
        const result = await this.processSceneFile(modelSource, svxSceneFile, idUserCreator);
        if(result.success===false)
            return this.logError('create system objects failed',`failed to process svx scene: ${result.error}`,{});
        else {
            RK.logInfo(RK.LogSection.eJOB,'process scene success','successful processing of svx scene',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, svxFileName: svxSceneFile.fileName },'Job.GenerateDownloads');
            await this.appendToReportAndLog(`JobCookSIGenerateDownloads successful processing of svx scene: ${svxSceneFile.fileName}`);
        }

        // link the models and assets to this Packrat Scene
        // Clone scene's systemObjectVersion, using the assetVersionOverrideMap populated with new/updated assets
        const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(sceneSystemObject.idSystemObject, null,
            'Created by Cook si-generate-downloads', assetVersionOverrideMap);
        if (!SOV)
            return this.logError('create system objects failed','unable to clone SystemObjectVersion', { sceneSystemObject });

        // cycle through models and if there's an asset version link up
        for(const model of modelFiles) {
            if (SOV && model.data.assetVersion) {
                RK.logDebug(RK.LogSection.eJOB,'create system objects','model linking to scene', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, model, scene: { name: sceneSource.Name, idSystemObject: SOV.idSystemObject } },'Job.GenerateDownloads');
                const SOVAVX: DBAPI.SystemObjectVersionAssetVersionXref | null =
                    await DBAPI.SystemObjectVersionAssetVersionXref.addOrUpdate(SOV.idSystemObjectVersion, model.data.assetVersion.idAsset, model.data.assetVersion.idAssetVersion);
                if (!SOVAVX)
                    RK.logError(RK.LogSection.eJOB,'create system objects','unable create/update SystemObjectVersionAssetVersionXref', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, SOV, modelAssetVersion: model.data.assetVersion },'Job.GenerateDownloads');
            }
        }

        // Add scene asset metadata for attachments
        // LOG.info('JobCookSIGenerateDownloads.createSystemObjects calling PublishScene.extractSceneMetadata', LOG.LS.eJOB);
        const metadataResult: H.IOResults = await PublishScene.extractSceneMetadata(sceneSystemObject.idSystemObject, LS?.idUser ?? null);
        if (!metadataResult.success)
            return this.logError('create system objects failed',`unable to persist scene attachment metadata: ${metadataResult.error}`,{});

        RK.logInfo(RK.LogSection.eJOB,'create system objects','successful generation of downloads', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, svxFileName: svxSceneFile.fileName },'Job.GenerateDownloads');
        await this.appendToReportAndLog(`JobCookSIGenerateDownloads successful generation of downloads: ${svxSceneFile.fileName}`);
        return { success: true };
    }

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
                RK.logError(RK.LogSection.eJOB,'compute vocab failed','unable to fetch vocabulary for Download Model Purpose', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.GenerateDownloads');
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
    }

    protected async recordSuccess(output: string): Promise<boolean> {
        // TODO:
        // - links for source model details
        // - button goes to report

        const updated: boolean = await super.recordSuccess(output);
        if(updated) {

            // attempt to get our report either from the WorkflowSet (preferred) or the
            // individual Workflow.
            const detailsMessage: string = `
                <b>Scene Name</b>: ${this.sceneParameterHelper?.sceneName ?? 'NA'}</br>
                <b>Source Model</b>: ${this.sceneParameterHelper?.SOModelSource.idSystemObject}</br></br>
                <b>Unit</b>: ${this.sceneParameterHelper?.OG?.unit?.[0]?.Name ?? 'NA'}</br>
                <b>Subject</b>: ${this.sceneParameterHelper?.OG?.subject?.[0]?.Name ?? 'NA'}</br>
                <b>Project</b>: ${this.sceneParameterHelper?.OG?.project?.[0]?.Name ?? 'NA'}</br>
            `;

            RK.logInfo(RK.LogSection.eJOB,'download generation completed',
                undefined,undefined,
                'Job.GenerateDownloads'
            );

            // build our URL
            const url: string = (this.sceneParameterHelper) ?
                RouteBuilder.RepositoryDetails(this.sceneParameterHelper.SOModelSource.idSystemObject,eHrefMode.ePrependClientURL) :
                Config.http.clientUrl +'/workflow';

            // send email out
            await RK.sendEmail(
                RK.NotifyType.JOB_PASSED,
                RK.NotifyGroup.EMAIL_USER,
                'Download Generation Finished',
                detailsMessage,
                this._dbJobRun.DateStart ?? new Date(),
                this._dbJobRun.DateEnd ?? undefined,
                (url.length>0) ? { url, label: 'Details' } : undefined
            );
        }
        return updated;
    }
    protected async recordFailure(output: string | null, errorMsg?: string): Promise<boolean> {
        // TODO:
        // - links for source model details
        // - button goes to report

        const updated: boolean = await super.recordFailure(output, errorMsg);
        if(updated) {

            // get our context for the message
            const detailsMessage: string = `
                <b>Error: ${this._dbJobRun.Error}</b></br></br>
                <b>Scene Name</b>: ${this.sceneParameterHelper?.sceneName ?? 'NA'}</br>
                <b>Source Model</b>: ${this.sceneParameterHelper?.SOModelSource.idSystemObject}</br></br>
                <b>Unit</b>: ${this.sceneParameterHelper?.OG?.unit?.[0]?.Name ?? 'NA'}</br>
                <b>Subject</b>: ${this.sceneParameterHelper?.OG?.subject?.[0]?.Name ?? 'NA'}</br>
                <b>Project</b>: ${this.sceneParameterHelper?.OG?.project?.[0]?.Name ?? 'NA'}</br>
            `;

            RK.logError(RK.LogSection.eJOB,'download generation failed',
                undefined,
                'Job.DownloadGeneration.recordFailure'
            );

            // build our URL
            // const url: string = RouteBuilder.DownloadJobRun(this._dbJobRun.idJobRun , eHrefMode.ePrependServerURL);
            const url: string = Config.http.clientUrl +'/workflow';

            // send email out
            await RK.sendEmail(
                RK.NotifyType.JOB_FAILED,
                RK.NotifyGroup.EMAIL_USER,
                'Download Generation Failed',
                detailsMessage,
                this._dbJobRun.DateStart ?? new Date(),
                this._dbJobRun.DateEnd ?? undefined,
                (url.length>0) ? { url, label: 'Details' } : undefined
            );
        }
        return updated;
    }

    //------------------------------------------------------------------------------
    // MODEL
    //------------------------------------------------------------------------------
    // #region model
    private async processModelFile(sceneSource: DBAPI.Scene, modelSource: DBAPI.Model, fileItem: FileProcessItem, RSR: STORE.ReadStreamResult, idUserCreator: number ): Promise<{ assetVersionOverrideMap: Map< number, number>, MSX: DBAPI.ModelSceneXref, assetVersion: DBAPI.AssetVersion|null } | null> { //Promise<H.IOResults> {

        // verify input
        if(!sceneSource || fileItem.fileName.length<=0 || idUserCreator < 0 || RSR == null) {
            this.logError('process model failed','invalid parameters passed',{ fileName: fileItem.fileName, fileType: fileItem.fileType });
            return null;
        }

        // grab our ModelSceneXref from the database for the master model <> scene.
        // This is used for defaults linking the model to a Scene in the even that one doesn't already exist
        const MSXSources: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromModelAndScene(modelSource.idModel, sceneSource.idScene);
        if (!MSXSources) {
            await this.logError('process model failed','unable to compute ModelSceneXrefs from idModel',{ idModel: this.idModel, idScene: this.idScene });
            return null;
        }
        const MSXSource: DBAPI.ModelSceneXref | null = MSXSources.length > 0 ? MSXSources[0] : null;
        // LOG.info(`>>> processModelFile ModelSceneXref.MSXSource: ${H.Helpers.JSONStringify(MSXSource)}`,LOG.LS.eDEBUG);

        // determine the vocabulary needed for ingestion. vocabulary is used for...
        const vModelGeometryFile: DBAPI.Vocabulary | undefined = await this.computeVocabModelGeometryFile();
        if (!vModelGeometryFile) {
            await this.logError('process model failed','createSystemObjects unable to calculate vocabulary needed to ingest generated downloads',{});
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
                    const name = H.Helpers.JSONStringify(modelSO);
                    await this.logError('process model failed','unable to fetch assets for model system object',{ name });
                    return null;
                }
            } else {
                const name = H.Helpers.JSONStringify(modelSource);
                await this.logError('process model failed','unable to fetch system objec',{ name });
                return null;
            }
        } else {
            // create Model (for each download generated)
            model = await this.createModel(fileItem.fileName, fileItem.downloadType, modelSource);
            if (!await model.create()) {
                const name = H.Helpers.JSONStringify(model);
                await this.logError('process model failed','unable to create model',{ name });
                return null;
            }

            // link model as derived from the scene
            const SOX1: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(sceneSource, model);
            if (!SOX1) {
                await this.logError('process model failed','unable to wire model to scene together',{ sceneSource, model });
                return null;
            }

            // link model as derived from the master model
            const SOX2: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, model);
            if (!SOX2) {
                await this.logError('process model failed','unable to wire model to master model source',{ modelSource, model });
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
        RK.logInfo(RK.LogSection.eJOB,'process model','ingesting',{ ...fileItem },'Job.GenerateDownloads');
        const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        if (!IAR.success) {
            await this.logError('process model failed',`unable to ingest generated download model: ${IAR.error}`,{ ...fileItem });
            return null;
        }

        // check for multiple asset versions
        // Q: what problem(s) does this cause?
        if (IAR.assetVersions && IAR.assetVersions.length > 1)
            await this.logError('process model failed','created multiple asset versions, unexpectedly',{ fileName: fileItem.fileName, fileType: fileItem.fileType });

        // if no SysObj exists for this model then we check our cache for one
        let idSystemObjectModel: number | null = modelSO ? modelSO.idSystemObject : null;
        if (!idSystemObjectModel) {
            const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromModel(model);
            idSystemObjectModel = SOI ? SOI.idSystemObject : null;
        }

        // build out our report details and add
        const assetVersion: DBAPI.AssetVersion | null = (IAR.assetVersions && IAR.assetVersions.length > 0) ? IAR.assetVersions[0] : null;
        const pathObject: string = idSystemObjectModel ? RouteBuilder.RepositoryDetails(idSystemObjectModel, eHrefMode.ePrependClientURL) : '';
        const hrefObject: string = H.Helpers.computeHref(pathObject, model.Name);
        const pathDownload: string = assetVersion ? RouteBuilder.DownloadAssetVersion(assetVersion.idAssetVersion, eHrefMode.ePrependServerURL) : '';
        const hrefDownload: string = pathDownload ? ': ' + H.Helpers.computeHref(pathDownload, 'Download') : '';

        RK.logInfo(RK.LogSection.eJOB,'process model','ingested generated download model',{ jobName: this.name(), pathObject, pathDownload },'Job.GenerateDownloads');
        await this.appendToReportAndLog(`${this.name()} ingested generated download model ${hrefObject}${hrefDownload}`);

        // currently not passed in. how is this used?
        const assetVersionOverrideMap: Map< number, number> = new Map<number, number>();
        if (assetVersion)
            assetVersionOverrideMap.set(assetVersion.idAsset, assetVersion.idAssetVersion);

        // create/update ModelSceneXref for each download generated ... do after ingest so that we have the storage size available
        const FileSize: bigint | null = assetVersion ? assetVersion.StorageSize : null;

        // get our ModelSceneXref from the model id, scene id, and objects name in the DB
        const MSXs: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromModelSceneAndName(model.idModel, sceneSource.idScene, model.Name);
        // LOG.info(`>>> processingModelFile current file (${model.Name}) ModelSceneXrefs: ${H.Helpers.JSONStringify(MSXs)}`,LOG.LS.eDEBUG);

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
            await this.logError('process model failed','cannot create/update ModelSceneXref',{ MSX });
            return null;
        }

        // run si-packrat-inspect on this model to get the metrics and make sure it's valid
        const profileKey: string = `${model.Name} inspection: ${H.Helpers.randomSlug()}`;
        RK.profile(profileKey,RK.LogSection.eJOB,`${model.Name} inspection`,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.GenerateDownloads');
        if (idSystemObjectModel) {
            const results: H.IOResults = await WorkflowUtil.computeModelMetrics(model.Name, model.idModel, idSystemObjectModel, undefined, undefined,
                undefined, undefined /* FIXME */, idUserCreator);
            if (results.success) {
                RK.logInfo(RK.LogSection.eJOB,'process model','extracted model metrics',{ model },'Job.GenerateDownloads');
                await this.appendToReportAndLog(`JobCookSIGenerateDownloads extracted model metrics for ${model.Name}`);
            } else if (results.error) {
                await this.logError('process model failed',`failed inspecting model: ${results.error}`,{ model });
                return null;
            }
        }
        RK.profileEnd(profileKey);

        return { assetVersionOverrideMap, MSX, assetVersion };
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
            ModelUse: modelSource.ModelUse ?? '[]',

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

        RK.logError(RK.LogSection.eJOB,'compute model properties failed','unsupported downloadType',{ downloadType },'Job.GenerateDownloads');
        return { usage: undefined, quality: undefined, uvResolution: undefined };
    }

    public static computeModelAutomationTagFromDownloadType(downloadType: string): string {

        const { usage, quality, uvResolution } = JobCookSIGenerateDownloads.computeModelPropertiesFromDownloadType(downloadType);
        if(usage==undefined || quality==undefined || uvResolution==undefined) {
            // LOG.error(`JobCookSIGenerateDownloads.computeModelAutomationTag unsupported downloadType: '${downloadType}' (${usage} | ${quality} | ${uvResolution})`,LOG.LS.eDEBUG);
            return `error-${downloadType}-null-null`;
        }

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

        RK.logError(RK.LogSection.eJOB,'compute model automation tag failed','unsupported downloadType',{ downloadType },'Job.GenerateDownloads');
        return `unknown-${downloadType}`;
    }

    private async computeVocabModelGeometryFile(): Promise<DBAPI.Vocabulary | undefined> {
        if (!JobCookSIGenerateDownloads.vocabModelGeometryFile) {
            JobCookSIGenerateDownloads.vocabModelGeometryFile = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile);
            if (!JobCookSIGenerateDownloads.vocabModelGeometryFile)
                RK.logError(RK.LogSection.eJOB,'compute vocab failed','unable to fetch vocabulary for Asset Type Model Geometry File',{},'Job.GenerateDownloads');
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
    // VOYAGER SCENE
    //------------------------------------------------------------------------------
    // #region scene
    private async processSceneFile(modelSource: DBAPI.Model, fileItem: FileProcessItem, idUserCreator: number): Promise<H.IOResults> {

        if (!this.sceneParameterHelper)
            return await this.logError('process scene failed','called without needed parameters',{ modelSource, fileItem });

        const svxFile: string = fileItem.fileName; //this.parameters.svxFile ?? 'scene.svx.json';
        const svxData = fileItem.data;
        const vScene: DBAPI.Vocabulary | undefined = await this.computeVocabAssetTypeScene();
        const vModel: DBAPI.Vocabulary | undefined = await this.computeVocabAssetTypeModelGeometryFile();
        if (!vScene || !vModel)
            return await this.logError('process scene failed','unable to calculate vocabulary needed to ingest scene file', { svxFile });

        RK.logDebug(RK.LogSection.eJOB,'process scene','parsing scene', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, svxFile },'Job.GenerateDownloads');
        // LOG.info(`JobCookSIGenerateDownloads.processSceneFile fetched scene:${H.Helpers.JSONStringify(svxData)}`, LOG.LS.eJOB);

        // Look for an existing scene, which is a child of the master model (modelSource)
        // TODO: what if there are multiple?
        const scenes: DBAPI.Scene[] | null = await DBAPI.Scene.fetchChildrenScenes(modelSource.idModel);
        if (!scenes)
            return await this.logError('process scene failed','unable to fetch children scenes of master model', { modelSource });

        // if we have more than one scene see if there is a clear path to selecting one (i.e. one has EDAN id)
        // TODO: investigate why the system sometimes creates additional scenes
        if(scenes.length>1) {
            RK.logWarning(RK.LogSection.eJOB,'process scene','found multiple scenes. pruning...', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, numScenes: scenes.length },'Job.GenerateDownloads');

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
                RK.logError(RK.LogSection.eJOB,'process scene failed','pruning found scene. Needs cleanup.', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, removedSceneIds,  },'Job.GenerateDownloads');
                scenes.length = 0;
                scenes.push(...scenesWithEdanUUID);
            } else {
                // If there are more than one, clear the removed IDs as no scene is removed
                removedSceneIds.length = 0;
                RK.logError(RK.LogSection.eJOB,'process scene failed','pruning returned multiple scenes. needs cleanup.', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, scenesWithEdanUUID, idModel: modelSource.idModel },'Job.GenerateDownloads');
            }
        }

        // if we have multiple valid scenes, bail
        if(scenes.length>1)
            return await this.logError('process scene failed','multiple valid scenes found. cannot find asset to update',{ numScenes: scenes.length, fileItem });

        // If needed, create a new scene (if we have no scenes, or if we have multiple scenes, then create a new one);
        // If we have just one scene, before reusing it, see if the model names all match up
        let createScene: boolean = (scenes.length !== 1);
        if (!createScene && scenes.length > 0 && svxData.modelDetails) {

            for (const MSX of svxData.modelDetails) {
                if (MSX.Name) {

                    // look for existing models, children of our scene, that match this model's purpose
                    const model: DBAPI.Model | null = await this.findMatchingModelFromScene(scenes[0], MSX.computeModelAutomationTag());

                    if (!model || (model.Name !== MSX.Name)) {
                        createScene = true;
                        break;
                    }  // else, found a match for the model
                } // else, no MSX found so likely a download
            }
        }

        const scene: DBAPI.Scene = createScene ? svxData.extractScene() : scenes[0];
        // LOG.info(`createScene: ${createScene}`,LOG.LS.eDEBUG);
        // LOG.info(`scene: ${H.Helpers.JSONStringify(scene)}`,LOG.LS.eDEBUG);

        let asset: DBAPI.Asset | null = null;
        if (createScene) {
            RK.logDebug(RK.LogSection.eJOB,'process scene','creating new scene', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, sceneName: scene.Name },'Job.GenerateDownloads');

            // compute ItemParent of ModelSource
            scene.Name = this.sceneParameterHelper.sceneName;
            if (this.sceneParameterHelper.sceneTitle)
                scene.Title = this.sceneParameterHelper.sceneTitle;
            if (!await scene.create())
                return await this.logError('process scene failed','unable to create Scene file',{ svxFile });

            // wire ModelSource to Scene
            const SOX: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, scene);
            if (!SOX)
                return await this.logError('process scene failed','unable to wire Model Source to Scene',{ modelSource, scene });

            // wire ItemParent to Scene
            const OG: DBAPI.ObjectGraph = this.sceneParameterHelper.OG;
            if (OG.item && OG.item.length > 0) {
                const SOX2: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(OG.item[0], scene);
                if (!SOX2)
                    return await this.logError('process scene failed','unable to wire item to Scene',{ item: OG.item[0], scene });
            }
            // LOG.info(`JobCookSIGenerateDownloads.processSceneFile[${svxFile}] wire ModelSource to Scene: ${H.Helpers.JSONStringify(SOX)}`, LOG.LS.eJOB);
        } else {
            RK.logDebug(RK.LogSection.eJOB,'process scene','updating existing scene', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, sceneName: scene.Name },'Job.GenerateDownloads');

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
                    RK.logError(RK.LogSection.eJOB,'process scene failed','unable to fetch assets for scene systemobject', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, sceneSO },'Job.GenerateDownloads');
            } else
                RK.logError(RK.LogSection.eJOB,'process scene failed','unable to fetch system object', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, scene },'Job.GenerateDownloads');
        }

        // Scene owns this ingested asset of the SVX File
        // Read file a second time ... cloneStream isn't available
        const RSR = await this.fetchFile(svxFile);
        if (!RSR.success || !RSR.readStream)
            return await this.logError('process scene failed',`unable to fetch stream for scene file: ${RSR.error}`,{ svxFile });

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
            return await this.logError('process scene failed',`unable to ingest scene file: ${IAR.error}`,{ svxFile });
        if (IAR.assetVersions && IAR.assetVersions.length > 1)
            await this.logError('process scene failed','created multiple asset versions, unexpectedly',{ svxFile });

        const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromScene(scene);
        const assetVersion: DBAPI.AssetVersion | null = (IAR.assetVersions && IAR.assetVersions.length > 0) ? IAR.assetVersions[0] : null;
        const pathObject: string = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
        const hrefObject: string = H.Helpers.computeHref(pathObject, scene.Name);
        const pathDownload: string = assetVersion ? RouteBuilder.DownloadAssetVersion(assetVersion.idAssetVersion, eHrefMode.ePrependServerURL) : '';
        const hrefDownload: string = pathDownload ? ': ' + H.Helpers.computeHref(pathDownload, 'Download') : '';

        RK.logInfo(RK.LogSection.eJOB,'process scene','ingested scene', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, pathObject, pathDownload },'Job.GenerateDownloads');
        await this.appendToReportAndLog(`${this.name()} ingested scene ${hrefObject}${hrefDownload}`);

        //#region legacy
        // previous version handled all models while working with the scene. Order of operations prevents this from working
        // in this context. However, the below code may be necessary for additional linking of processed models. Testing didn't
        // expose a need for this, but keep temporarily until more models are run through.
        //
        // const SOV: DBAPI.SystemObjectVersion | null | undefined = IAR.systemObjectVersion; // SystemObjectVersion for updated 'scene', with new version of scene asset
        // LOG.info(`JobCookSIGenerateDownloads.processSceneFile[${svxFile}] wire ingestStreamOrFile: ${H.Helpers.JSONStringify(ISI)}`, LOG.LS.eJOB);

        // if an asset version was created for ingestion of this model, and if a system object version was created for scene ingestion,
        // associate the asset version with the scene's system object version (enabling a scene package to be downloaded, even if some assets
        // are owned by the ingested models). Note that if we *updated* models, we will be update the original models'
        // SystemObjectVersionAssetVersionXref with records pointing to the new model asset versions
        // if (SOV && assetVersion) {
        //     const SOVAVX: DBAPI.SystemObjectVersionAssetVersionXref | null =
        //         await DBAPI.SystemObjectVersionAssetVersionXref.addOrUpdate(SOV.idSystemObjectVersion, assetVersion.idAsset, assetVersion.idAssetVersion);
        //     if (!SOVAVX)
        //         LOG.error(`JobCookSIGenerateDownloads.processSceneFile unable create/update SystemObjectVersionAssetVersionXref for ${H.Helpers.JSONStringify(SOV, H.Helpers.saferStringify)}, ${H.Helpers.JSONStringify(assetVersion, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
        // }
        //#endregion

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
            AutomationTag: MSX.computeModelAutomationTag(), CountTriangles: null,
            ModelUse: source?.ModelUse ?? '[]'
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
        // LOG.info(`>>>> matching model from scene: ${sceneSource.idScene} | ${automationTag}`,LOG.LS.eDEBUG);
        const matches: DBAPI.Model[] | null = await DBAPI.Model.fetchChildrenModels(null, sceneSource.idScene, automationTag);

        return matches && matches.length > 0 ? matches[0] : null;
    }

    private async computeVocabVoyagerSceneModel(): Promise<DBAPI.Vocabulary | undefined> {
        if (!JobCookSIGenerateDownloads.vocabVoyagerSceneModel) {
            JobCookSIGenerateDownloads.vocabVoyagerSceneModel = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeVoyagerSceneModel);
            if (!JobCookSIGenerateDownloads.vocabVoyagerSceneModel)
                RK.logError(RK.LogSection.eJOB,'compute vocab failed','unable to fetch vocabulary for Voyager Scene Model Model Purpose', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.GenerateDownloads');
        }
        return JobCookSIGenerateDownloads.vocabVoyagerSceneModel;
    }

    private async computeVocabAssetTypeScene(): Promise<DBAPI.Vocabulary | undefined> {
        if (!JobCookSIGenerateDownloads.vocabAssetTypeScene) {
            JobCookSIGenerateDownloads.vocabAssetTypeScene = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeScene);
            if (!JobCookSIGenerateDownloads.vocabAssetTypeScene)
                RK.logError(RK.LogSection.eJOB,'compute vocab failed','unable to fetch vocabulary for Asset Type Scene', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.GenerateDownloads');
        }
        return JobCookSIGenerateDownloads.vocabAssetTypeScene;
    }

    private async computeVocabAssetTypeModelGeometryFile(): Promise<DBAPI.Vocabulary | undefined> {
        if (!JobCookSIGenerateDownloads.vocabAssetTypeModelGeometryFile) {
            JobCookSIGenerateDownloads.vocabAssetTypeModelGeometryFile = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile);
            if (!JobCookSIGenerateDownloads.vocabAssetTypeModelGeometryFile)
                RK.logError(RK.LogSection.eJOB,'compute vocab failed','unable to fetch vocabulary for Asset Type Model Geometry File', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.GenerateDownloads');
        }
        return JobCookSIGenerateDownloads.vocabAssetTypeModelGeometryFile;
    }

    protected async verifyIncomingCookData(sceneSource: DBAPI.Scene, fileMap: Map<string,string>): Promise<H.IOResults> {

        const result: H.IOResults = await super.verifyIncomingCookData(sceneSource, fileMap);
        if(result.success == false)
            return this.logError('verify Cook data','verifying base failed',{ sceneSource, fileMap });

        // fileMap is the list of received downloads. make sure we have all of the expected files
        const suffixes: string[] = [
            '-150k-4096_std.glb',
            '-100k-2048_std_draco.glb',
            '.svx.json',
            '-100k-2048_std.usdz',
            '-full_resolution-obj_std.zip',
            '-150k-4096-gltf_std.zip',
            '-150k-4096-obj_std.zip'
        ];
        const missingIncomingFiles: string[] = [];

        // make sure we have all downloads accounted for
        const incomingFilenames: string[] = Array.from(fileMap.values());
        suffixes.forEach(suffix => {
            const found: boolean = incomingFilenames.some(filename => filename.endsWith(suffix));
            if(found===false)
                missingIncomingFiles.push(suffix);
        });
        if(missingIncomingFiles.length>0)
            return this.logError('verify Cook data','failed to find expected files in Cook response', { missingIncomingFiles });

        // determine all incoming filenames are consistent
        const incomingBaseName: string | null = this.extractBaseName(incomingFilenames);
        if(!incomingBaseName)
            return this.logError('verify Cook data','incoming filenames are inconsistent.',{ incomingBaseName, incomingFilenames });

        // get all assets from scene.
        const sceneAssets: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromScene(sceneSource.idScene);
        if(!sceneAssets || sceneAssets.length == 0)
            return this.logError('verify Cook data','cannot find any assets for the Packrat scene.',{ logInfo: sceneSource.fetchLogInfo() });

        const sceneAssetFilenames: string[] = sceneAssets.map(asset => asset.FileName);
        RK.logDebug(RK.LogSection.eJOB,'verify Cook data',undefined, { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, sceneAssetFilenames, fileMap },'Job.GenerateDownloads');

        // cycle through returned downloads seeing if we have a similar file already in the scene
        // if so, then we check to see if they have the same basename. If not, then we fail and the
        // scene needs to be rebuilt.
        const assetsToReplace: string[] = [];
        for(let i=0; i<incomingFilenames.length; i++) {
            const filename: string = incomingFilenames[i];
            const suffix: string | undefined = suffixes.find(s => filename.endsWith(s) );
            if(!suffix)
                return this.logError('verify Cook data','could not find suffix in verified filenames',{ fileName: filename });

            // find the existing scene asset with the same suffix and check it's basename
            const matchingAsset: DBAPI.Asset | undefined = sceneAssets.find(asset => asset.FileName.endsWith(suffix) );
            if(matchingAsset)
                if(filename!=matchingAsset.FileName)
                    return this.logError('verify Cook data','incoming download has different basename than existing asset', { fileName: filename, matchingAsset });
                else
                    assetsToReplace.push(filename);
        }

        RK.logInfo(RK.LogSection.eJOB,'verify Cook data','verified', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, logInfo: sceneSource.fetchLogInfo(), numFilesNew: (incomingFilenames.length-assetsToReplace.length), numFilesUpdated: assetsToReplace.length },'Job.GenerateDownloads');
        return { success: true };
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

    private async logError(error: string, reason: string, data: any | undefined, addToReport: boolean = true): Promise<H.IOResults> {

        RK.logError(RK.LogSection.eJOB,error,reason,data ? { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, ...data }: undefined,'Job.GenerateDownloads');

        if(addToReport===true)
            await this.appendToReportAndLog(`${this.name()} ${reason}`);

        return { success: false, error: reason };
    }
    // #endregion
}
