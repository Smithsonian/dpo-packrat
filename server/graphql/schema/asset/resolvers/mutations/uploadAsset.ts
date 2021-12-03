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
import { ASL, LocalStore } from '../../../../../utils/localStore';
import { AuditFactory } from '../../../../../audit/interface/AuditFactory';
import { eEventKey } from '../../../../../event/interface/EventEnums';

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

    constructor(user: User | undefined, apolloFile: ApolloFile, idAsset: number | undefined | null, type: number, idSOAttachment: number | undefined | null) {
        super();
        this.user = user;
        this.apolloFile = apolloFile;
        this.idAsset = idAsset;
        this.type = type;
        this.idSOAttachment = idSOAttachment;
    }

    async upload(): Promise<UploadAssetResult> {
        this.LS = await ASL.getOrCreateStore();

        const UAR: UploadAssetResult = await this.uploadWorker();

        const success: boolean = (UAR.status === UploadStatus.Complete);
        if (this.workflowHelper?.workflow)
            await this.workflowHelper.workflow.updateStatus(success ? DBAPI.eWorkflowJobRunStatus.eDone : DBAPI.eWorkflowJobRunStatus.eError);

        if (success)
            await this.appendToWFReport('<b>Upload succeeded</b>');
        else
            await this.appendToWFReport(`<b>Upload failed</b>: ${UAR.error}`);
        return UAR;
    }

    private async uploadWorker(): Promise<UploadAssetResult> {
        const { filename, createReadStream } = this.apolloFile;
        AuditFactory.audit({ url: `/ingestion/uploads/${filename}`, auth: (this.user !== undefined) }, { eObjectType: DBAPI.eSystemObjectType.eAsset, idObject: this.idAsset ?? 0 }, eEventKey.eHTTPUpload);

        if (!this.user) {
            LOG.error('uploadAsset unable to retrieve user context', LOG.LS.eGQL);
            return { status: UploadStatus.Failed, error: 'User not authenticated' };
        }

        if (this.idSOAttachment)
            await this.appendToWFReport(`<b>Upload starting</b>: ATTACH ${filename}`, true);
        else if (!this.idAsset)
            await this.appendToWFReport(`<b>Upload starting</b>: ADD ${filename}`, true);
        else
            await this.appendToWFReport(`<b>Upload starting</b>: UPDATE ${filename}`, true);

        const storage: STORE.IStorage | null = await STORE.StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            LOG.error('uploadAsset unable to retrieve Storage Implementation from StorageFactory.getInstance()', LOG.LS.eGQL);
            return { status: UploadStatus.Failed, error: 'Storage unavailable' };
        }

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
            const fileStream = createReadStream();
            const stream = fileStream.pipe(writeStream);

            return new Promise(resolve => {
                fileStream.on('error', () => {
                    stream.emit('error');
                });

                stream.on('finish', async () => {
                    resolve(this.uploadWorkerOnFinish(storageKey, filename, vocabulary.idVocabulary));
                });

                stream.on('error', async () => {
                    await this.appendToWFReport('uploadAsset Upload failed', true, true);
                    await storage.discardWriteStream({ storageKey });
                    resolve({ status: UploadStatus.Failed, error: 'Upload failed' });
                });

                // stream.on('close', async () => { });
            });
        } catch (error) {
            LOG.error('uploadAsset', LOG.LS.eGQL, error);
            return { status: UploadStatus.Failed, error: 'Upload failed' };
        }
    }

    private async uploadWorkerOnFinish(storageKey: string, filename: string, idVocabulary: number): Promise<UploadAssetResult> {
        const LSLocal: LocalStore | undefined = ASL.getStore();
        if (LSLocal)
            return await this.uploadWorkerOnFinishWorker(storageKey, filename, idVocabulary);

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
                idUserCreator: this.user!.idUser, // eslint-disable-line @typescript-eslint/no-non-null-assertion
                DateCreated: new Date()
            };

            commitResult = await STORE.AssetStorageAdapter.commitNewAsset(ASCNAI);
        } else { // update existing asset with new asset version
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(this.idAsset);
            if (!asset) {
                const error: string = `uploadAsset unable to fetch asset ${this.idAsset}`;
                LOG.error(error, LOG.LS.eGQL);
                return { status: UploadStatus.Failed, error };
            }
            const ASCNAVI: STORE.AssetStorageCommitNewAssetVersionInput = {
                storageKey,
                storageHash: null,
                asset,
                idSOAttachment: this.idSOAttachment,
                assetNameOverride: filename,
                idUserCreator: this.user!.idUser, // eslint-disable-line @typescript-eslint/no-non-null-assertion
                DateCreated: new Date()
            };
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
        if (!this.workflowHelper.success)
            return { status: UploadStatus.Failed, error: this.workflowHelper.error };

        let success: boolean = true;
        let error: string = '';
        const idAssetVersions: number[] = [];
        if (this.workflowHelper.workflowEngine) {
            for (const assetVersion of assetVersions) {
                // At this point, we've created the assets
                // Now, we want to perform ingestion object-type specific automations ... i.e. based on vocabulary
                // If we're ingesting a model, we want to initiate two separate workflows:
                // (1) WorkflowJob, for the Cook si-packrat-inspect recipe
                // (2) if this is a master model, WorkflowJob, for Cook scene creation & derivative generation
                //
                // Our aim is to be able to update the apolloUpload control, changing status, and perhaps showing progress
                // We could make the upload 80% of the total, and then workflow step (1) the remaining 20%
                // Workflow (1) has create job, transfer files, start job, await results
                // Workflow (2) should run asynchronously and independently
                // assetVersion.fetchSystemObject()
                const sysInfo: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromAssetVersion(assetVersion);
                const workflowParams: WF.WorkflowParameters = {
                    eWorkflowType: null,
                    idSystemObject: sysInfo ? [sysInfo.idSystemObject] : null,
                    idProject: null, // TODO: update with project ID
                    idUserInitiator: this.user!.idUser, // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    parameters: null
                };

                const workflow: WF.IWorkflow | null = await this.workflowHelper.workflowEngine.event(CACHE.eVocabularyID.eWorkflowEventIngestionUploadAssetVersion, workflowParams);
                const results = workflow ? await workflow.waitForCompletion(3600000) : { success: true };
                if (results.success) {
                    idAssetVersions.push(assetVersion.idAssetVersion);
                    if (assetVersion.Ingested === null) {
                        assetVersion.Ingested = false;
                        if (!await assetVersion.update())
                            LOG.error('uploadAsset post-upload workflow succeeded, but unable to update asset version ingested flag', LOG.LS.eGQL);
                    }
                } else {
                    await this.appendToWFReport(`uploadAsset post-upload workflow error: ${results.error}`, true, true);
                    await this.retireFailedUpload(assetVersion);
                    success = false;
                    error = 'Post-upload Workflow Failed';
                }
            }
        }

        if (success)
            return { status: UploadStatus.Complete, idAssetVersions };
        else
            return { status: UploadStatus.Failed, error, idAssetVersions };
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
                eObjectType: DBAPI.eSystemObjectType.eAssetVersion,
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
            eWorkflowType: CACHE.eVocabularyID.eWorkflowTypeUpload,
            idSystemObject,
            idProject: null,    // TODO: populate with idProject
            idUserInitiator: this.user!.idUser, // eslint-disable-line @typescript-eslint/no-non-null-assertion
            parameters: null,
        };

        const workflow: WF.IWorkflow | null = await workflowEngine.create(wfParams);
        if (!workflow) {
            const error: string = `uploadAsset createWorkflow unable to create Upload workflow: ${JSON.stringify(wfParams)}`;
            LOG.error(error, LOG.LS.eGQL);
            return { success: false, error };
        }

        const workflowReport: REP.IReport | null = await REP.ReportFactory.getReport();
        const results: H.IOResults = workflow ? await workflow.waitForCompletion(3600000) : { success: true };
        if (!results.success) {
            for (const assetVersion of assetVersions)
                await this.retireFailedUpload(assetVersion);
            LOG.error(`uploadAsset createWorkflow Upload workflow failed: ${results.error}`, LOG.LS.eGQL);
            return results;
        }

        return { success: true, workflowEngine, workflow, workflowReport };
    }

    private async retireFailedUpload(assetVersion: DBAPI.AssetVersion): Promise<H.IOResults> {
        const SO: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject();
        if (SO) {
            if (await SO.retireObject())
                return { success: true };
            const error: string = 'uploadAsset post-upload workflow error handler failed to retire uploaded asset';
            LOG.error(error, LOG.LS.eGQL);
            return { success: false, error };
        } else {
            const error: string = 'uploadAsset post-upload workflow error handler failed to fetch system object for uploaded asset';
            LOG.error(error, LOG.LS.eGQL);
            return { success: false, error };
        }
    }
}
