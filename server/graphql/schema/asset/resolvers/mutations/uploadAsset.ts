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

interface ApolloFile {
    filename: string;
    mimetype: string;
    encoding: string;
    createReadStream: () => ReadStream;
}

export default async function uploadAsset(_: Parent, args: MutationUploadAssetArgs, context: Context): Promise<UploadAssetResult> {
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
        this.LS = await ASL.getOrCreateStore();
        const UAR: UploadAssetResult = await this.uploadWorker();

        const success: boolean = (UAR.status === UploadStatus.Complete);
        if (this.workflowHelper?.workflow)
            await this.workflowHelper.workflow.updateStatus(success ? COMMON.eWorkflowJobRunStatus.eDone : COMMON.eWorkflowJobRunStatus.eError);

        if (success)
            await this.appendToWFReport('<b>Upload succeeded</b>');
        else
            await this.appendToWFReport(`<b>Upload failed</b>: ${UAR.error}`);
        return UAR;
    }

    private async uploadWorker(): Promise<UploadAssetResult> {
        // creates a WorkflowReport for the upload request allowing for asynchronous handling

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

        try {
            // write our incoming stream of bytes to a file in local storage (staging)
            // TODO: use ASR.bind(async () =>< {});
            const fileStream = createReadStream();
            const stream = fileStream.pipe(writeStream);
            LOG.info(`UploadAssetWorker.uploadWorker writing stream to Staging (filename: ${filename} | streamPath: ${fileStream.path})`,LOG.LS.eDEBUG);

            return new Promise(resolve => {
                fileStream.on('error', ASR.bind((error) => {
                    LOG.error('uploadAsset', LOG.LS.eGQL, error);
                    stream.emit('error', error);
                }));

                stream.on('finish', ASR.bind(async () => {
                    resolve(this.uploadWorkerOnFinish(storageKey, filename, vocabulary.idVocabulary));
                }));

                stream.on('error', ASR.bind(async (error) => {
                    await this.appendToWFReport(`uploadAsset Upload failed (${error.message})`, true, true);
                    await storage.discardWriteStream({ storageKey });
                    resolve({ status: UploadStatus.Failed, error: `Upload failed (${error.message})` });
                }));

                // stream.on('close', async () => { });
            });
        } catch (error) {
            LOG.error('uploadAsset', LOG.LS.eGQL, error);
            return { status: UploadStatus.Failed, error: 'Upload failed' };
        }
    }

    private async uploadWorkerOnFinish(storageKey: string, filename: string, idVocabulary: number): Promise<UploadAssetResult> {

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
