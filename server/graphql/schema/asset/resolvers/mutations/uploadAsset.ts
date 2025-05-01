import { ReadStream } from 'fs-extra';
import { MutationUploadAssetArgs, UploadAssetResult, UploadStatus, User /*, AssetType */ } from '../../../../../types/graphql';
import { ResolverBase, IWorkflowHelper } from '../../../ResolverBase';
import { Parent, Context } from '../../../../../types/resolvers';
import * as STORE from '../../../../../storage/interface';
// import * as LOG from '../../../../../utils/logger';
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
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

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
    const profileKey: string = 'upload: '+H.Helpers.randomSlug();
    RK.logInfo(RK.LogSection.eGQL,'upload asset request',undefined,args,'GraphQL.uploadAsset',true);
    RK.profile(profileKey,RK.LogSection.eGQL,'upload asset',{},'GraphQL.uploadAsset');
    const { user } = context;

    // using GraphQL and graphql-upload middleware the client sends a multi-part/form upload (stream)
    // this stream is written to a temporary location on disk by the middleware. args.file returns a
    // Promise that resolves to the files metadata and a routine to get a ReadStream to the temporary file
    //
    // NOTE: getting the ReadStream does NOT mean the file has been fully written to disk yet. For very
    // large files this can fall out of sync causing dropped connections/streams. It is especially sensitive
    // to concurrent large uploads and disk, memory, or network I/O bottlenecks.
    const memoryBefore = process.memoryUsage();
    const apolloFile: ApolloFile = await args.file;
    const uploadAssetWorker: UploadAssetWorker = new UploadAssetWorker(user, apolloFile, args.idAsset, args.type, args.idSOAttachment);
    const workerResult = await uploadAssetWorker.upload();
    const memoryAfter = process.memoryUsage();

    // log our memory consumption and update our profiler to include it
    // RK.logDebug(RK.LogSection.eGQL,'upload asset','request result',{ rss: (memoryBefore.rss-memoryAfter.rss), heap: (memoryBefore.heapUsed-memoryAfter.heapUsed), workerResult },'GraphQL.uploadAsset');
    RK.profileUpdate(profileKey, { file: apolloFile.filename, type: args.type, idAsset: args.idAsset, rss: (memoryBefore.rss-memoryAfter.rss), heap: (memoryBefore.heapUsed-memoryAfter.heapUsed) });
    RK.profileEnd(profileKey);
    return workerResult;
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
        RK.logInfo(RK.LogSection.eGQL,'asset upload started',undefined,{ file: this.apolloFile.filename },'UploadAssetWorker');

        // entry point for file upload requests coming from the client
        this.LS = await ASL.getOrCreateStore();
        const UAR: UploadAssetResult = await this.uploadWorker();

        const success: boolean = (UAR.status === UploadStatus.Complete);
        if (this.workflowHelper?.workflow)
            await this.workflowHelper.workflow.updateStatus(success ? COMMON.eWorkflowJobRunStatus.eDone : COMMON.eWorkflowJobRunStatus.eError);

        if (success) {
            await this.appendToWFReport('<b>Upload succeeded</b>');
            RK.logInfo(RK.LogSection.eGQL,'asset upload success',undefined,{ file: this.apolloFile.filename, ...UAR },'UploadAssetWorker');
        } else {
            await this.appendToWFReport(`<b>Upload failed</b>: ${UAR.error}`);
            RK.logError(RK.LogSection.eGQL,'asset upload failed',UAR.error ?? 'unknown error',{ file: this.apolloFile.filename },'UploadAssetWorker');
        }

        return UAR;
    }

    private async uploadWorker(): Promise<UploadAssetResult> {
        // creates a WorkflowReport for the upload request allowing for asynchronous handling
        RK.logDebug(RK.LogSection.eGQL,'upload worker started',undefined,{ file: this.apolloFile.filename },'UploadAssetWorker');

        const { filename, createReadStream } = this.apolloFile;
        const url: string = `/ingestion/uploads/${filename}`;
        const auditResult: boolean = await AuditFactory.audit({ url, auth: (this.user !== undefined) }, { eObjectType: COMMON.eSystemObjectType.eAsset, idObject: this.idAsset ?? 0 }, eEventKey.eHTTPUpload);
        if(auditResult===false) {
            RK.logError(RK.LogSection.eGQL,'property check failed','unknown error',{ file: this.apolloFile.filename, url, idUser: this.user?.idUser ?? -1, idAsset: this.idAsset },'UploadAssetWorker');
            return { status: UploadStatus.Failed, error: 'Failed property audit' };
        }
        if (!this.user) {
            RK.logError(RK.LogSection.eGQL,'auth check failed','user not authenticated',{ file: this.apolloFile.filename },'UploadAssetWorker');
            return { status: UploadStatus.Noauth, error: 'User not authenticated' };
        }

        // if an idAsset was provided then we are trying to update an existing asset
        // else if an 'attachment' is specified (this is a child) then we will try to attach
        // otherwise, we are adding a new asset to the system
        if (this.idAsset) {
            RK.logDebug(RK.LogSection.eGQL,'asset updating',undefined,{ file: this.apolloFile.filename },'UploadAssetWorker');
            await this.appendToWFReport(`<b>Upload starting</b>: UPDATE ${filename}`, false);
        } else if (this.idSOAttachment) {
            RK.logDebug(RK.LogSection.eGQL,'asset attaching',undefined,{ file: this.apolloFile.filename },'UploadAssetWorker');
            await this.appendToWFReport(`<b>Upload starting</b>: ATTACH ${filename}`, false);
        } else {
            RK.logDebug(RK.LogSection.eGQL,'asset creating',undefined,{ file: this.apolloFile.filename },'UploadAssetWorker');
            await this.appendToWFReport(`<b>Upload starting</b>: ADD ${filename}`, false);
        }

        const storage: STORE.IStorage | null = await STORE.StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            RK.logCritical(RK.LogSection.eGQL,'storage system failed','unable to retrieve Storage Implementation from StorageFactory',{ file: this.apolloFile.filename },'UploadAssetWorker');
            return { status: UploadStatus.Failed, error: 'Storage system unavailable' };
        }

        // get a write stream for us to store the incoming stream
        const WSResult: STORE.WriteStreamResult = await storage.writeStream(filename);
        if (!WSResult.success || !WSResult.writeStream || !WSResult.storageKey) {
            RK.logError(RK.LogSection.eGQL,'storage system failed','unable to retrieve write stream from IStroage',{ file: this.apolloFile.filename, error: WSResult.error },'UploadAssetWorker');
            return { status: UploadStatus.Failed, error: 'Storage unavailable' };
        }
        const { writeStream, storageKey } = WSResult;
        const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(this.type);
        if (!vocabulary) {
            RK.logError(RK.LogSection.eGQL,'vocabulary failed','unable to retrieve asset type vocabulary',{ file: this.apolloFile.filename, type: this.type },'UploadAssetWorker');
            return { status: UploadStatus.Failed, error: 'Unable to retrieve asset type vocabulary' };
        }

        try {
            // write our incoming stream of bytes to a file in local storage (staging)
            const fileStream = createReadStream({ highWaterMark: 1024 * 1024 });
            const stream = fileStream.pipe(writeStream);
            RK.logDebug(RK.LogSection.eGQL,'upload staging','writing stream to staging',{ file: this.apolloFile.filename, path: fileStream.path },'UploadAssetWorker');

            return await new Promise((resolve) => {
                let isResolved = false;
                const safeResolve = (value) => {
                    // make sure Promise resolves only one and avoid multiple calls
                    if (!isResolved) {
                        isResolved = true;
                        resolve(value);
                    }
                };

                // file (read) stream callbacks. taking bytes transfered from the buffer
                fileStream.once('error', ASR.bind(async (error) => {
                    RK.logError(RK.LogSection.eGQL,'filestream failed',H.Helpers.getErrorString(error),{ file: this.apolloFile.filename },'UploadAssetWorker');
                    await this.appendToWFReport(`FileStream error: ${error.message}`, false, true);

                    await storage.discardWriteStream({ storageKey });
                    safeResolve({ status: UploadStatus.Failed, error: `FileStream error: ${error.message}` });
                    // stream.emit('error', error);
                }));
                fileStream.once('end', () => {
                    RK.logDebug(RK.LogSection.eGQL,'filestream finished',undefined,{ file: this.apolloFile.filename },'UploadAssetWorker');
                });
                fileStream.once('close', () => {
                    RK.logDebug(RK.LogSection.eGQL,'filestream closed',undefined,{ file: this.apolloFile.filename },'UploadAssetWorker');
                });

                // (write) stream callbacks for storing the transferred bytes to disk
                const thresholdOffset: number = 10*1024*1024;
                let totalBytes: number = 0;
                let nextThreshold: number = thresholdOffset;

                stream.on('data', (chunk) => {
                    totalBytes += chunk.length;
                    if(totalBytes>=nextThreshold) {
                        RK.logDebug(RK.LogSection.eGQL,'transferred bytes','transferred from tmp to staging',{ file: this.apolloFile.filename, totalBytes, url },'UploadAssetWorker');
                        nextThreshold += thresholdOffset;
                    }
                });
                stream.once('finish', ASR.bind(async () => {
                    // resolve(this.uploadWorkerOnFinish(storageKey, filename, vocabulary.idVocabulary));
                    safeResolve(await this.uploadWorkerOnFinish(storageKey, filename, vocabulary.idVocabulary));
                }));
                stream.once('error', ASR.bind(async (error) => {
                    RK.logError(RK.LogSection.eGQL,'writestream failed',H.Helpers.getErrorString(error),{ file: this.apolloFile.filename },'UploadAssetWorker');
                    await this.appendToWFReport(`UploadAssetWorker.uploadWorker: upload failed (${error.message})`, false, true);

                    await storage.discardWriteStream({ storageKey });
                    safeResolve({ status: UploadStatus.Failed, error: `Upload failed (${error.message})` });
                }));
                stream.once('close', () => {
                    RK.logDebug(RK.LogSection.eGQL,'writestream closed',undefined,{ file: this.apolloFile.filename },'UploadAssetWorker');
                });
                // stream.on('drain', () => {
                //     LOG.info('UploadAssetWorker.uploadWorker: stream drained.',LOG.LS.eDEBUG);
                // });
            });
        } catch (error) {
            RK.logError(RK.LogSection.eGQL,'upload worker failed',H.Helpers.getErrorString(error),{ file: this.apolloFile.filename },'UploadAssetWorker');
            return { status: UploadStatus.Failed, error: 'Upload failed' };
        }
    }

    private async uploadWorkerOnFinish(storageKey: string, filename: string, idVocabulary: number): Promise<UploadAssetResult> {

        // grab our local storage and log context in case it's lost
        const LSLocal: LocalStore | undefined = ASL.getStore();
        ASL.checkLocalStore('UploadAssetVersion.uploadWorkerOnFinish',true);
        if (LSLocal)
            return await this.uploadWorkerOnFinishWorker(storageKey, filename, idVocabulary);

        // if we can't get the local storage system we will use the cache
        // TODO: do we want this as it occurs when the context is lost for ASL. when is the cache set?
        //       if CACHE is used how does it sync back with the main storage system?
        if (this.LS) {
            RK.logWarning(RK.LogSection.eGQL,'context store failed','missing LocalStore on finish. using cached value',{ file: this.apolloFile.filename, storageKey, idVocabulary },'UploadAssetWorker');

            return ASL.run(this.LS, async () => {
                return await this.uploadWorkerOnFinishWorker(storageKey, filename, idVocabulary);
            });
        } else {
            RK.logError(RK.LogSection.eGQL,'context store failed','missing LocalStore. no cached value',{ file: this.apolloFile.filename, storageKey, idVocabulary },'UploadAssetWorker');
        }

        RK.logDebug(RK.LogSection.eGQL,'upload worker finished',undefined,{ file: this.apolloFile.filename, storageKey, idVocabulary },'UploadAssetWorker');
        return await this.uploadWorkerOnFinishWorker(storageKey, filename, idVocabulary);
    }

    private async uploadWorkerOnFinishWorker(storageKey: string, filename: string, idVocabulary: number): Promise<UploadAssetResult> {
        // RK.logInfo(RK.LogSection.eGQL,'upload worker','finishing worker and adding new assets',{ file: this.apolloFile.filename, storageKey, idVocabulary },'UploadAssetWorker');

        const idUser: number = this.user!.idUser; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        const opInfo: STORE.OperationInfo | null = await STORE.AssetStorageAdapter.computeOperationInfo(idUser,
            this.idAsset
                ? `Uploaded new version of asset ${this.idAsset}, with filename ${filename}`
                : `Uploaded new asset ${filename}`);
        if (!opInfo) {
            const error: string = `uploadAsset unable to compute operation info from user ${idUser}`;
            RK.logError(RK.LogSection.eGQL,'info compute failed','unable to compute operation info',{ file: this.apolloFile.filename, idUser },'UploadAssetWorker');
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

            RK.logDebug(RK.LogSection.eGQL,'asset commit success',undefined,{ file: this.apolloFile.filename, storageKey: ASCNAI.storageKey, idVAssetType: ASCNAI.idVAssetType, idSOAttachment: ASCNAI.idSOAttachment },'UploadAssetWorker');
            commitResult = await STORE.AssetStorageAdapter.commitNewAsset(ASCNAI);
        } else { // update existing asset with new asset version
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(this.idAsset);
            if (!asset) {
                const error: string = `uploadAsset unable to fetch asset ${this.idAsset}`;
                RK.logError(RK.LogSection.eGQL,'asset fetch failed','not in DB',{ file: this.apolloFile.filename, idAsset: this.idAsset },'UploadAssetWorker');
                return { status: UploadStatus.Failed, error };
            }

            const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(this.idAsset);
            if (!assetVersion) {
                const error: string = `uploadAsset unable to fetch latest asset version from asset ${this.idAsset}`;
                RK.logError(RK.LogSection.eGQL,'asset version fetch failed','unable to fetch latest',{ file: this.apolloFile.filename, idAsset: this.idAsset },'UploadAssetWorker');
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

            RK.logDebug(RK.LogSection.eGQL,'asset version commit success',undefined,{ file: this.apolloFile.filename, path: ASCNAVI.FilePath, storageKey: ASCNAVI.storageKey, idVAssetType: ASCNAVI.asset.idAsset, idSOAttachment: ASCNAVI.idSOAttachment, },'UploadAssetWorker');
            commitResult = await STORE.AssetStorageAdapter.commitNewAssetVersion(ASCNAVI);
        }

        if (!commitResult.success) {
            RK.logError(RK.LogSection.eGQL,'asset commit failed',H.Helpers.getErrorString(commitResult.error),{ file: this.apolloFile.filename },'UploadAssetWorker');
            return { status: UploadStatus.Failed, error: commitResult.error };
        }
        // commitResult.assets; commitResult.assetVersions; <-- These have been created
        const { assetVersions } = commitResult;
        if (!assetVersions) {
            RK.logError(RK.LogSection.eGQL,'asset check failed','no asset versions created',{ file: this.apolloFile.filename },'UploadAssetWorker');
            return { status: UploadStatus.Failed, error: 'No Asset Versions created' };
        }

        this.workflowHelper = await this.createUploadWorkflow(assetVersions);
        if (this.workflowHelper.success)
            return { status: UploadStatus.Complete, idAssetVersions: this.idAssetVersions };
        else {
            RK.logError(RK.LogSection.eGQL,'workflow create failed',H.Helpers.getErrorString(this.workflowHelper.error),{ file: this.apolloFile.filename },'UploadAssetWorker');
            return { status: UploadStatus.Failed, error: this.workflowHelper.error, idAssetVersions: this.idAssetVersions };
        }
    }

    async createUploadWorkflow(assetVersions: DBAPI.AssetVersion[]): Promise<IWorkflowHelper> {
        const workflowEngine: WF.IWorkflowEngine | null = await WF.WorkflowFactory.getInstance();
        if (!workflowEngine) {
            const error: string = 'uploadAsset createWorkflow could not load WorkflowEngine';
            RK.logCritical(RK.LogSection.eGQL,'workflow factory failed','cannot load WorkflowEngine',{ file: this.apolloFile.filename },'UploadAssetWorker');
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

                RK.logInfo(RK.LogSection.eGQL,'asset version upload success',undefined,{ file: this.apolloFile.filename, path },'UploadAssetWorker');
                await this.appendToWFReport(`Uploaded asset: ${href}`);
            } else {
                RK.logError(RK.LogSection.eGQL,'asset version upload failed','unable to fetch system object',{ file: this.apolloFile.filename, ...oID },'UploadAssetWorker');
            }
        }

        const wfParams: WF.WorkflowParameters = {
            eWorkflowType: COMMON.eVocabularyID.eWorkflowTypeUpload,
            idSystemObject,
            // idProject: TODO: populate with idProject
            idUserInitiator: this.user!.idUser, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        };

        const workflow: WF.IWorkflow | null = await workflowEngine.create(wfParams);
        if (!workflow) {
            const error: string = `unable to create Upload workflow: ${JSON.stringify(wfParams)}`;
            RK.logError(RK.LogSection.eGQL,'workflow create failed',undefined,{ file: this.apolloFile.filename, ...wfParams },'UploadAssetWorker');
            return { success: false, error };
        }
        const workflowObj: DBAPI.Workflow | null = await workflow.getWorkflowObject();

        const workflowReport: REP.IReport | null = await REP.ReportFactory.getReport();
        const results: H.IOResults = workflow ? await workflow.waitForCompletion(1 * 60 * 60 * 1000) : { success: true }; // 1 hour
        if (!results.success) {
            for (const assetVersion of assetVersions)
                await UploadAssetWorker.retireFailedUpload(assetVersion);

            RK.logError(RK.LogSection.eGQL,'workflow failed',H.Helpers.getErrorString(results.error),{ file: this.apolloFile.filename, idWorkflow: workflowObj?.idWorkflow ?? -1 },'UploadAssetWorker');
            return results;
        }

        this.idAssetVersions = [];
        for (const assetVersion of assetVersions)
            this.idAssetVersions.push(assetVersion.idAssetVersion);

        RK.logInfo(RK.LogSection.eGQL,'workflow create success',undefined,{ file: this.apolloFile.filename, idWorkflow: workflowObj?.idWorkflow ?? -1 },'UploadAssetWorker');
        return { success: true, workflowEngine, workflow, workflowReport };
    }

    private static async retireFailedUpload(assetVersion: DBAPI.AssetVersion): Promise<H.IOResults> {
        const ASR: STORE.AssetStorageResult = await STORE.AssetStorageAdapter.discardAssetVersion(assetVersion);
        if (!ASR.success) {
            const error: string = `post-upload workflow error handler failed to discard uploaded asset: ${ASR.error}`;
            RK.logError(RK.LogSection.eGQL,'asset retire failed',H.Helpers.getErrorString(ASR.error),{ file: assetVersion.FileName, idAssetVersion: assetVersion.idAssetVersion, idAsset: assetVersion.idAsset },'UploadAssetWorker');
            return { success: false, error };
        }
        return { success: true };
    }
}
