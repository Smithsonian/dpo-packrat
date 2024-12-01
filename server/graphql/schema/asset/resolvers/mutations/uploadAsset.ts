/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReadStream } from 'fs-extra';
import { MutationUploadAssetArgs, UploadAssetResult, UploadStatus, User /*, AssetType */ } from '../../../../../types/graphql';
import { ResolverBase, IWorkflowHelper } from '../../../ResolverBase';
import { Parent, Context } from '../../../../../types/resolvers';
import * as STORE from '../../../../../storage/interface';
import * as LOG from '../../../../../utils/logger';
import * as H from '../../../../../utils/helpers';
import * as CACHE from '../../../../../cache';
import * as DBAPI from '../../../../../db';
import * as WF from '../../../../../workflow/interface';
import * as REP from '../../../../../report/interface';
import { RouteBuilder, eHrefMode } from '../../../../../http/routes/routeBuilder';
import { ASL, ASR, LocalStore } from '../../../../../utils/localStore';
import { AuditFactory } from '../../../../../audit/interface/AuditFactory';
import { eEventKey } from '../../../../../event/interface/EventEnums';
import * as COMMON from '@dpo-packrat/common';
import { RecordKeeper } from '../../../../../records/recordKeeper';

interface StreamOptions {
    highWaterMark?: number;  // the buffer size and should range between 64kb and 1024kb depending on disk & network I/O.
}
interface ApolloFile {
    filename: string;
    mimetype: string;
    encoding: string;
    createReadStream: (options?: StreamOptions) => ReadStream;
}

export default async function uploadAsset(_: Parent, args: MutationUploadAssetArgs, context: Context): Promise<UploadAssetResult> {
    RecordKeeper.logDebug(RecordKeeper.LogSection.eGQL,'request received for upload', { args, user: context.user }, 'GraphQL.uploadAsset');
    const { user } = context;
    const uploadAssetWorker: UploadAssetWorker = new UploadAssetWorker(user, await args.file, args.idAsset, args.type, args.idSOAttachment);
    return await uploadAssetWorker.upload();
}

class UploadAssetWorker extends ResolverBase {
    private user: User | undefined;
    private apolloFile: ApolloFile;
    private idAsset: number | undefined | null;
    private type: number;
    private LS: LocalStore | null = null;
    private idSOAttachment: number | undefined | null;
    private idAssetVersions: number[] | null = null;

    constructor(user: User | undefined, apolloFile: ApolloFile, idAsset: number | undefined | null, type: number, idSOAttachment: number | undefined | null) {
        super();
        this.user = user;
        this.apolloFile = apolloFile;
        this.idAsset = idAsset;
        this.type = type;
        this.idSOAttachment = idSOAttachment;
    }

    async upload(): Promise<UploadAssetResult> {
        // entry point for file upload requests coming from the client
        RecordKeeper.logDebug(RecordKeeper.LogSection.eGQL,'upload starting...', undefined, 'GraphQL.uploadAsset.upload');

        // get our local store and wait for the upload to finish
        this.LS = await ASL.getOrCreateStore();
        const UAR: UploadAssetResult = await this.uploadWorker();

        const success: boolean = (UAR.status === UploadStatus.Complete);
        if (this.workflowHelper?.workflow)
            await this.workflowHelper.workflow.updateStatus(success ? COMMON.eWorkflowJobRunStatus.eDone : COMMON.eWorkflowJobRunStatus.eError);

        if (success)
            await this.appendToWFReport('<b>Upload succeeded</b>');
        else
            await this.appendToWFReport(`<b>Upload failed</b>: ${UAR.error}`);

        RecordKeeper.logDebug(RecordKeeper.LogSection.eGQL,'upload finished', UAR, 'GraphQL.uploadAsset.upload');
        return UAR;
    }

    private async uploadWorker(): Promise<UploadAssetResult> {
        // creates a WorkflowReport for the upload request allowing for asynchronous handling
        RecordKeeper.logDebug(RecordKeeper.LogSection.eGQL,'upload worker starting...', undefined, 'GraphQL.uploadAsset.uploadWorker');

        const { filename, createReadStream } = this.apolloFile;
        AuditFactory.audit({ url: `/ingestion/uploads/${filename}`, auth: (this.user !== undefined) }, { eObjectType: COMMON.eSystemObjectType.eAsset, idObject: this.idAsset ?? 0 }, eEventKey.eHTTPUpload);

        if (!this.user) {
            LOG.error('uploadAsset unable to retrieve user context', LOG.LS.eGQL);
            return { status: UploadStatus.Noauth, error: 'User not authenticated' };
        }

        // if an idAsset was provided then we are trying to update an existing asset
        // else if an 'attachment' is specified (this is a child) then we will try to attach
        // otherwise, we are adding a new asset to the system
        if (this.idAsset)
            await this.appendToWFReport(`<b>Upload starting</b>: UPDATE ${filename}`, true);
        else if (this.idSOAttachment)
            await this.appendToWFReport(`<b>Upload starting</b>: ATTACH ${filename}`, true);
        else
            await this.appendToWFReport(`<b>Upload starting</b>: ADD ${filename}`, true);

        const storage: STORE.IStorage | null = await STORE.StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            LOG.error('uploadAsset unable to retrieve Storage Implementation from StorageFactory.getInstance()', LOG.LS.eGQL);
            return { status: UploadStatus.Failed, error: 'Storage system unavailable' };
        }

        // get a write stream for us to store the incoming stream
        const WSResult: STORE.WriteStreamResult = await storage.writeStream(filename);
        if (!WSResult.success || !WSResult.writeStream || !WSResult.storageKey) {
            LOG.error(`uploadAsset unable to retrieve IStorage.writeStream(): ${WSResult.error}`, LOG.LS.eGQL);
            return { status: UploadStatus.Failed, error: 'Storage unavailable' };
        }
        const { writeStream, storageKey } = WSResult;
        const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(this.type);
        if (!vocabulary) {
            LOG.error('uploadAsset unable to retrieve asset type vocabulary', LOG.LS.eGQL);
            return { status: UploadStatus.Failed, error: 'Unable to retrieve asset type vocabulary' };
        }

        // generate a key and start performance measuring
        const perfKey: string = filename+'_'+H.Helpers.randomSlug();
        RecordKeeper.profile(perfKey,RecordKeeper.LogSection.eHTTP,'uploading file', { filename }, 'GraphQL.uploadAsset.uploadWorker');

        try {
            // write our incoming stream of bytes to a file in local storage (staging)
            // Note: highWatermark sets the buffer size and should range between 64kb and 1024kb
            // depending on disk & network I/O.
            const fileStream = createReadStream({ highWaterMark: 512 * 1024 });

            RecordKeeper.logInfo(RecordKeeper.LogSection.eGQL,'writing stream to Staging', { filename, stream: fileStream.readable }, 'GraphQL.uploadAsset.uploadWorker');
            // const stream = fileStream.pipe(writeStream);

            // we await the return as fix for lost connections on large uploads
            // and make sure that if there's an error we handle it before returning
            return await new Promise(resolve => {
                let totalBytes: number = 0;
                let lastOutput: number = Date.now();
                let bufferSaturated: boolean = false;

                // consume our data removing from buffer. If the response stream's buffer fills up, it tells the server to stop sending data
                // (this is handled at the TCP layer). So we need to read the data via the handler so more data from the server is transferred
                // until some point in which there is no more data. Only once the server has no more data to send will you get an end events.
                fileStream.on('data', ASR.bind(async (chunk) => {
                    // DEBUG: track our progress
                    totalBytes += chunk.length;
                    if(Date.now()-lastOutput > 100) {
                        await RecordKeeper.logDebug(RecordKeeper.LogSection.eGQL,`Received ${chunk.length} bytes. Total: ${totalBytes} bytes`, { filename }, 'GraphQL.uploadAsset.uploadWorker');
                        lastOutput = Date.now();
                    }

                    // write our data out. if it fails then we're over-saturated and need to drain
                    const canContinue = writeStream.write(chunk);
                    if (!canContinue) {
                        bufferSaturated = true; // Mark that the buffer became full
                        fileStream.pause(); // Pause reading until the drain event
                        // RecordKeeper.logWarning(RecordKeeper.LogSection.eGQL,'upload write stream buffer is saturated, waiting for drain...', { filename }, 'GraphQL.uploadAsset.uploadWorker');
                    }
                }));

                fileStream.on('error', ASR.bind(async (error) => {
                    RecordKeeper.logError(RecordKeeper.LogSection.eGQL,'upload filestream error', { filename, error }, 'GraphQL.uploadAsset.uploadWorker');
                    RecordKeeper.profileEnd(perfKey);
                    // RecordKeeper.sendSlack(RecordKeeper.NotifyType.JOB_FAILED,RecordKeeper.NotifyGroup.SLACK_ADMIN,'uploadAsset failed',`${error}\n${filename}`);

                    // send the error to our writeStream as well to tell it to stop
                    if(writeStream.emit('error', error)===false)
                        resolve({ status: UploadStatus.Failed, error: `Upload failed (${error.message})` });
                    else
                        resolve({ status: UploadStatus.Complete });
                }));

                fileStream.on('end', () => {
                    RecordKeeper.logDebug(RecordKeeper.LogSection.eGQL,'upload filestream ended', { filename }, 'GraphQL.uploadAsset.uploadWorker');
                    writeStream.end();
                    // force end of writeStream? no, because it could still be writing
                });

                // DEBUG: track when the buffers are drained releasing back pressure
                // fileStream.on('drain', () => {
                //     RecordKeeper.logDebug(RecordKeeper.LogSection.eGQL,'upload filestream drained', { filename }, 'GraphQL.uploadAsset.uploadWorker');
                // });
                writeStream.on('drain', () => {
                    if (bufferSaturated===true) {
                        // RecordKeeper.logDebug(RecordKeeper.LogSection.eGQL,'upload write stream drained. resuming transfer', { filename }, 'GraphQL.uploadAsset.uploadWorker');
                        bufferSaturated = false; // Reset the saturation flag
                        fileStream.resume(); // Resume reading from the stream
                    }
                });

                writeStream.on('finish', ASR.bind(async () => {
                    RecordKeeper.logInfo(RecordKeeper.LogSection.eGQL,'upload stream finished', { filename }, 'GraphQL.uploadAsset.uploadWorker');
                    RecordKeeper.profileEnd(perfKey);
                    // RecordKeeper.sendSlack(RecordKeeper.NotifyType.JOB_PASSED,RecordKeeper.NotifyGroup.SLACK_ADMIN,'uploadAsset finished upload',filename);
                    resolve(this.uploadWorkerOnFinish(storageKey, filename, vocabulary.idVocabulary));
                }));

                writeStream.on('error', ASR.bind(async (error) => {
                    RecordKeeper.logError(RecordKeeper.LogSection.eGQL,'upload stream error', { filename, error }, 'GraphQL.uploadAsset.uploadWorker');
                    await this.appendToWFReport(`uploadAsset Upload failed (${error.message})`, true, true);
                    await storage.discardWriteStream({ storageKey });
                    RecordKeeper.profileEnd(perfKey);
                    // RecordKeeper.sendSlack(RecordKeeper.NotifyType.JOB_FAILED,RecordKeeper.NotifyGroup.SLACK_ADMIN,'uploadAsset failed',`${error.message}\n${filename}`);
                    resolve({ status: UploadStatus.Failed, error: `Upload failed (${error.message})` });
                }));

                writeStream.on('close', () => {
                    RecordKeeper.logDebug(RecordKeeper.LogSection.eGQL,'upload write stream closed', { filename }, 'GraphQL.uploadAsset.uploadWorker');
                });

                // stream.on('close', async () => { });
            });
        } catch (error) {
            RecordKeeper.logError(RecordKeeper.LogSection.eGQL,'upload other error', { filename, error }, 'GraphQL.uploadAsset.uploadWorker');
            RecordKeeper.profileEnd(perfKey);
            RecordKeeper.sendSlack(RecordKeeper.NotifyType.JOB_FAILED,RecordKeeper.NotifyGroup.SLACK_ADMIN,'uploadAsset error',`${error}\n${filename}`);
            return { status: UploadStatus.Failed, error: 'Upload failed' };
        }
    }

    private async uploadWorkerOnFinish(storageKey: string, filename: string, idVocabulary: number): Promise<UploadAssetResult> {

        RecordKeeper.logDebug(RecordKeeper.LogSection.eGQL,'upload worker finished and wrapping up...', { filename, storageKey }, 'GraphQL.uploadAsset.uploadWorkerOnFinish');
        LOG.info(`UploadAssetWorker.uploadWorkerOnFinish upload finished (storageKey: ${storageKey} | filename: ${filename} | idVocabulary: ${idVocabulary})`,LOG.LS.eDEBUG);

        // grab our local storage and log context in case it's lost
        const LSLocal: LocalStore | undefined = ASL.getStore();
        ASL.checkLocalStore('UploadAssetVersion.uploadWorkerOnFinish',true);
        if (LSLocal)
            return await this.uploadWorkerOnFinishWorker(storageKey, filename, idVocabulary);

        // if we can't get the local storage system we will use the cache
        // TODO: do we want this as it occurs when the context is lost for ASL. when is the cache set?
        //       if CACHE is used how does it sync back with the main storage system?
        if (this.LS) {
            LOG.info('uploadAsset missing LocalStore, using cached value', LOG.LS.eGQL);
            return ASL.run(this.LS, async () => {
                return await this.uploadWorkerOnFinishWorker(storageKey, filename, idVocabulary);
            });
        } else
            LOG.info('uploadAsset missing LocalStore, no cached value', LOG.LS.eGQL);
        return await this.uploadWorkerOnFinishWorker(storageKey, filename, idVocabulary);
    }

    private async uploadWorkerOnFinishWorker(storageKey: string, filename: string, idVocabulary: number): Promise<UploadAssetResult> {
        RecordKeeper.logDebug(RecordKeeper.LogSection.eGQL,'finishing worker and adding new assets', undefined, 'GraphQL.uploadAsset.uploadWorkerOnFinishWorker');

        const idUser: number = this.user!.idUser; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        const opInfo: STORE.OperationInfo | null = await STORE.AssetStorageAdapter.computeOperationInfo(idUser,
            this.idAsset
                ? `Uploaded new version of asset ${this.idAsset}, with filename ${filename}`
                : `Uploaded new asset ${filename}`);
        if (!opInfo) {
            const error: string = `uploadAsset unable to compute operation info from user ${idUser}`;
            LOG.error(error, LOG.LS.eGQL);
            return { status: UploadStatus.Failed, error };
        }

        let commitResult: STORE.AssetStorageResultCommit;
        if (!this.idAsset) { // create new asset and asset version
            const ASCNAI: STORE.AssetStorageCommitNewAssetInput = {
                storageKey,
                storageHash: null,
                FileName: filename,
                FilePath: '',
                idAssetGroup: 0,
                idVAssetType: idVocabulary,
                idSOAttachment: this.idSOAttachment,
                opInfo,
                DateCreated: new Date()
            };

            LOG.info(`UploadAssetWorker.uploadWorkerOnFinishWorker committing new asset (asset: ${H.Helpers.JSONStringify(ASCNAI)})`,LOG.LS.eDEBUG);
            commitResult = await STORE.AssetStorageAdapter.commitNewAsset(ASCNAI);
        } else { // update existing asset with new asset version
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(this.idAsset);
            if (!asset) {
                const error: string = `uploadAsset unable to fetch asset ${this.idAsset}`;
                LOG.error(error, LOG.LS.eGQL);
                return { status: UploadStatus.Failed, error };
            }

            const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(this.idAsset);
            if (!assetVersion) {
                const error: string = `uploadAsset unable to fetch latest asset version from asset ${this.idAsset}`;
                LOG.error(error, LOG.LS.eGQL);
                return { status: UploadStatus.Failed, error };
            }

            const ASCNAVI: STORE.AssetStorageCommitNewAssetVersionInput = {
                storageKey,
                storageHash: null,
                asset,
                idSOAttachment: this.idSOAttachment,
                assetNameOverride: filename,
                FilePath: assetVersion.FilePath,
                opInfo,
                DateCreated: new Date()
            };

            LOG.info(`UploadAssetWorker.uploadWorkerOnFinishWorker committing new asset version (assetVersion: ${H.Helpers.JSONStringify(ASCNAVI)})`,LOG.LS.eDEBUG);
            commitResult = await STORE.AssetStorageAdapter.commitNewAssetVersion(ASCNAVI);
        }

        if (!commitResult.success) {
            LOG.error(`uploadAsset AssetStorageAdapter.commitNewAsset() failed: ${commitResult.error}`, LOG.LS.eGQL);
            return { status: UploadStatus.Failed, error: commitResult.error };
        }
        // commitResult.assets; commitResult.assetVersions; <-- These have been created
        const { assetVersions } = commitResult;
        if (!assetVersions)
            return { status: UploadStatus.Failed, error: 'No Asset Versions created' };

        this.workflowHelper = await this.createUploadWorkflow(assetVersions);
        if (this.workflowHelper.success)
            return { status: UploadStatus.Complete, idAssetVersions: this.idAssetVersions };
        else
            return { status: UploadStatus.Failed, error: this.workflowHelper.error, idAssetVersions: this.idAssetVersions };
    }

    async createUploadWorkflow(assetVersions: DBAPI.AssetVersion[]): Promise<IWorkflowHelper> {
        const workflowEngine: WF.IWorkflowEngine | null = await WF.WorkflowFactory.getInstance();
        if (!workflowEngine) {
            const error: string = 'uploadAsset createWorkflow could not load WorkflowEngine';
            LOG.error(error, LOG.LS.eGQL);
            return { success: false, error };
        }

        // Map asset versions to system object array
        const idSystemObject: number[] = [];
        for (const assetVersion of assetVersions) {
            const oID: DBAPI.ObjectIDAndType = {
                idObject: assetVersion.idAssetVersion,
                eObjectType: COMMON.eSystemObjectType.eAssetVersion,
            };
            const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
            if (SOI) {
                idSystemObject.push(SOI.idSystemObject);

                const path: string = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject, eHrefMode.ePrependClientURL) : '';
                const href: string = H.Helpers.computeHref(path, assetVersion.FileName);
                await this.appendToWFReport(`Uploaded asset: ${href}`);
            } else
                LOG.error(`uploadAsset createWorkflow unable to locate system object for ${JSON.stringify(oID)}`, LOG.LS.eGQL);
        }

        const wfParams: WF.WorkflowParameters = {
            eWorkflowType: COMMON.eVocabularyID.eWorkflowTypeUpload,
            idSystemObject,
            // idProject: TODO: populate with idProject
            idUserInitiator: this.user!.idUser, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        };

        const workflow: WF.IWorkflow | null = await workflowEngine.create(wfParams);
        if (!workflow) {
            const error: string = `uploadAsset createWorkflow unable to create Upload workflow: ${JSON.stringify(wfParams)}`;
            LOG.error(error, LOG.LS.eGQL);
            return { success: false, error };
        }

        const workflowReport: REP.IReport | null = await REP.ReportFactory.getReport();
        const results: H.IOResults = workflow ? await workflow.waitForCompletion(1 * 60 * 60 * 1000) : { success: true }; // 1 hour
        if (!results.success) {
            for (const assetVersion of assetVersions)
                await UploadAssetWorker.retireFailedUpload(assetVersion);
            LOG.error(`uploadAsset createWorkflow Upload workflow failed: ${results.error}`, LOG.LS.eGQL);
            return results;
        }

        this.idAssetVersions = [];
        for (const assetVersion of assetVersions)
            this.idAssetVersions.push(assetVersion.idAssetVersion);

        return { success: true, workflowEngine, workflow, workflowReport };
    }

    private static async retireFailedUpload(assetVersion: DBAPI.AssetVersion): Promise<H.IOResults> {
        const ASR: STORE.AssetStorageResult = await STORE.AssetStorageAdapter.discardAssetVersion(assetVersion);
        if (!ASR.success) {
            const error: string = `uploadAsset post-upload workflow error handler failed to discard uploaded asset: ${ASR.error}`;
            LOG.error(error, LOG.LS.eGQL);
            return { success: false, error };
        }
        return { success: true };
    }
}
