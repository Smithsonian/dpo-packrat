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
import { PublishScene } from '../../../collections/impl/PublishScene';
import { ASL, LocalStore } from '../../../utils/localStore';
import { RouteBuilder, eHrefMode } from '../../../http/routes/routeBuilder';

import * as path from 'path';

export class JobCookSIGenerateDownloadsParameters {
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

    private static vocabDownload: DBAPI.Vocabulary | undefined = undefined;

    constructor(jobEngine: JOB.IJobEngine, idAssetVersions: number[] | null, report: REP.IReport | null,
        parameters: JobCookSIGenerateDownloadsParameters, dbJobRun: DBAPI.JobRun) {
        super(jobEngine, Config.job.cookClientId, 'si-generate-downloads',
            CookRecipe.getCookRecipeID('si-generate-downloads', 'fcef7b5c-2df5-4a63-8fe9-365dd1a5e39c'),
            null, idAssetVersions, report, dbJobRun);
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

    private async createSystemObjects(): Promise<H.IOResults> {
        const sceneSource: DBAPI.Scene | null = this.idScene ? await DBAPI.Scene.fetch(this.idScene) : null;
        if (!sceneSource) {
            const error: string = `JobCookSIGenerateDownloads.createSystemObjects unable to compute source scene from id ${this.idScene}`;
            LOG.error(error, LOG.LS.eJOB);
            return { success: false, error };
        }

        const sceneSystemObject: DBAPI.SystemObject | null = await sceneSource.fetchSystemObject();
        if (!sceneSystemObject) {
            const error: string = `JobCookSIGenerateDownloads.createSystemObjects unable to fetch scene system object from ${JSON.stringify(sceneSource, H.Helpers.saferStringify)}`;
            LOG.error(error, LOG.LS.eJOB);
            return { success: false, error };
        }

        const modelSource: DBAPI.Model | null = this.idModel ? await DBAPI.Model.fetch(this.idModel) : null;
        if (!modelSource) {
            const error: string = `JobCookSIGenerateDownloads.createSystemObjects unable to compute source model from id ${this.idModel}`;
            LOG.error(error, LOG.LS.eJOB);
            return { success: false, error };
        }

        const MSXSources: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromModelAndScene(modelSource.idModel, sceneSource.idScene);
        if (!MSXSources) {
            const error: string = `JobCookSIGenerateDownloads.createSystemObjects unable to compute ModelSceneXrefs from idModel ${this.idModel}, idScene ${this.idScene}`;
            LOG.error(error, LOG.LS.eJOB);
            return { success: false, error };
        }

        const vModel: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile);
        if (!vModel) {
            const error: string = 'JobCookSIGenerateDownloads.createSystemObjects unable to calculate vocabulary needed to ingest generated downloads';
            LOG.error(error, LOG.LS.eJOB);
            return { success: false, error };
        }

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
            if (!RSR.success || !RSR.readStream) {
                LOG.error(`JobCookSIGenerateDownloads.createSystemObjects unable to fetch stream for generated download ${downloadFile}: ${RSR.error}`, LOG.LS.eJOB);
                return { success: false, error: RSR.error };
            }

            // look for existing model, a child object of modelSource, with the matching downloadType
            let model: DBAPI.Model | null = await this.findMatchingModel(modelSource, downloadType);
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
                if (!await model.create()) {
                    const error: string = `JobCookSIGenerateDownloads.createSystemObjects unable to create model ${JSON.stringify(model, H.Helpers.saferStringify)}`;
                    LOG.error(error, LOG.LS.eJOB);
                    return { success: false, error };
                }

                // link each model as derived from both the scene and the master model
                const SOX1: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(sceneSource, model);
                if (!SOX1) {
                    const error: string = `JobCookSIGenerateDownloads.createSystemObjects unable to wire Scene ${JSON.stringify(sceneSource, H.Helpers.saferStringify)} and Model ${JSON.stringify(model, H.Helpers.saferStringify)} together`;
                    LOG.error(error, LOG.LS.eJOB);
                    return { success: false, error };
                }

                const SOX2: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(modelSource, model);
                if (!SOX2) {
                    const error: string = `JobCookSIGenerateDownloads.createSystemObjects unable to wire Model Source ${JSON.stringify(modelSource, H.Helpers.saferStringify)} and Model ${JSON.stringify(model, H.Helpers.saferStringify)} together`;
                    LOG.error(error, LOG.LS.eJOB);
                    return { success: false, error };
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
                idVAssetType: vModel.idVocabulary,
                allowZipCracking: false,
                idUserCreator,
                SOBased: model,
                Comment: 'Created by Cook si-generate-downloads',
                doNotUpdateParentVersion: true // we create a new system object version below
            };
            const ISR: STORE.IngestStreamOrFileResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
            if (!ISR.success) {
                await this.appendToReportAndLog(`${this.name()} unable to ingest generated download model ${downloadFile}: ${ISR.error}`, true);
                return { success: false, error: ISR.error };
            }

            let idSystemObjectModel: number | null = modelSO ? modelSO.idSystemObject : null;
            if (!idSystemObjectModel) {
                const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromModel(model);
                idSystemObjectModel = SOI ? SOI.idSystemObject : null;
            }
            const pathObject: string = idSystemObjectModel ? RouteBuilder.RepositoryDetails(idSystemObjectModel, eHrefMode.ePrependClientURL) : '';
            const hrefObject: string = H.Helpers.computeHref(pathObject, model.Name);
            const pathDownload: string = ISR.assetVersion ? RouteBuilder.DownloadAssetVersion(ISR.assetVersion.idAssetVersion, eHrefMode.ePrependServerURL) : '';
            const hrefDownload: string = pathDownload ? ': ' + H.Helpers.computeHref(pathDownload, 'Download') : '';
            await this.appendToReportAndLog(`${this.name()} ingested generated download model ${hrefObject}${hrefDownload}`);

            if (ISR.assetVersion)
                assetVersionOverrideMap.set(ISR.assetVersion.idAsset, ISR.assetVersion.idAssetVersion);

            // create/update ModelSceneXref for each download generated ... do after ingest so that we have the storage size available
            const FileSize: bigint | null = ISR.assetVersion ? ISR.assetVersion.StorageSize : null;
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

            if (!MSXResult) {
                const error: string = `JobCookSIGenerateDownloads.createSystemObjects unable to create/update ModelSceneXref ${JSON.stringify(MSX, H.Helpers.saferStringify)}`;
                LOG.error(error, LOG.LS.eJOB);
                return { success: false, error };
            }
        }

        // Clone scene's systemObjectVersion, using the assetVersionOverrideMap populated with new/updated assets
        const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(sceneSystemObject.idSystemObject, null,
            'Created by Cook si-generate-downloads', assetVersionOverrideMap);
        if (!SOV) {
            const error: string = `JobCookSIGenerateDownloads.createSystemObjects unable to clone SystemObjectVersion for ${JSON.stringify(sceneSystemObject, H.Helpers.saferStringify)}`;
            LOG.error(error, LOG.LS.eJOB);
            return { success: false, error };
        }

        // Add scene asset metadata for attachments
        // LOG.info('JobCookSIGenerateDownloads.createSystemObjects calling PublishScene.extractSceneMetadata', LOG.LS.eJOB);
        const metadataResult: H.IOResults = await PublishScene.extractSceneMetadata(sceneSystemObject.idSystemObject, LS?.idUser ?? null);
        if (!metadataResult.success)
            LOG.error(`JobCookSIGenerateDownloads.createSystemObjects unable to persist scene attachment metadata: ${metadataResult.error}`, LOG.LS.eJOB);

        return { success: true };
    }

    protected async getParameters(): Promise<JobCookSIGenerateDownloadsParameters> {
        return this.parameters;
    }

    protected computeModelAutomationTag(downloadType: string): string {
        return `download-${downloadType}`;
    }

    private async createModel(Name: string, downloadType: string, modelSource: DBAPI.Model): Promise<DBAPI.Model> {
        const vFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(Name);
        const vPurpose: DBAPI.Vocabulary | undefined = await this.computeVocabDownload();
        return new DBAPI.Model({
            idModel: 0,
            Name,
            DateCreated: new Date(),
            idVCreationMethod: modelSource.idVCreationMethod,
            idVModality: modelSource.idVModality,
            idVPurpose: vPurpose ? vPurpose.idVocabulary : null,
            idVUnits: modelSource.idVUnits,
            idVFileType: vFileType ? vFileType.idVocabulary : null,
            idAssetThumbnail: null, CountAnimations: null, CountCameras: null, CountFaces: null, CountLights: null,CountMaterials: null,
            CountMeshes: null, CountVertices: null, CountEmbeddedTextures: null, CountLinkedTextures: null, FileEncoding: null, IsDracoCompressed: null,
            AutomationTag: this.computeModelAutomationTag(downloadType), CountTriangles: null
        });
    }

    private async computeVocabDownload(): Promise<DBAPI.Vocabulary | undefined> {
        if (!JobCookSIGenerateDownloads.vocabDownload) {
            JobCookSIGenerateDownloads.vocabDownload = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeDownload);
            if (!JobCookSIGenerateDownloads.vocabDownload)
                LOG.error('JobCookSIGenerateDownloads unable to fetch vocabulary for Download Model Purpose', LOG.LS.eGQL);
        }
        return JobCookSIGenerateDownloads.vocabDownload;
    }

    private async findMatchingModel(modelSource: DBAPI.Model, downloadType: string): Promise<DBAPI.Model | null> {
        const matches: DBAPI.Model[] | null = await DBAPI.Model.fetchChildrenModels(modelSource.idModel, null, this.computeModelAutomationTag(downloadType));
        return matches && matches.length > 0 ? matches[0] : null;
    }
}
