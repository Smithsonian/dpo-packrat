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
import { RouteBuilder } from '../../../../../http/routes/routeBuilder';

interface ApolloFile {
    filename: string;
    mimetype: string;
    encoding: string;
    createReadStream: () => ReadStream;
}

export default async function uploadAsset(_: Parent, args: MutationUploadAssetArgs, context: Context): Promise<UploadAssetResult> {
    const { user } = context;
    const uploadAssetWorker: UploadAssetWorker = new UploadAssetWorker(user, await args.file, args.idAsset, args.type);
    return await uploadAssetWorker.upload();
}

class UploadAssetWorker extends ResolverBase {
    private user: User | undefined;
    private apolloFile: ApolloFile;
    private idAsset: number | undefined | null;
    private type: number;

    constructor(user: User | undefined, apolloFile: ApolloFile, idAsset: number | undefined | null, type: number) {
        super();
        this.user = user;
        this.apolloFile = apolloFile;
        this.idAsset = idAsset;
        this.type = type;
    }

    async upload(): Promise<UploadAssetResult> {
        const UAR: UploadAssetResult = await this.uploadWorker();
        if (UAR.status === UploadStatus.Complete)
            await this.appendToWFReport('<b>Upload succeeded</b>');
        else
            await this.appendToWFReport(`<b>Upload failed</b>: ${UAR.error}`);
        return UAR;
    }

    private async uploadWorker(): Promise<UploadAssetResult> {
        if (!this.user) {
            LOG.error('uploadAsset unable to retrieve user context', LOG.LS.eGQL);
            return { status: UploadStatus.Failed, error: 'User not authenticated' };
        }

        if (!this.idAsset)
            await this.appendToWFReport(`<b>Upload starting</b>: ADD ${this.apolloFile.filename}`, true);
        else
            await this.appendToWFReport(`<b>Upload starting</b>: UPDATE ${this.apolloFile.filename}`, true);

        const storage: STORE.IStorage | null = await STORE.StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            LOG.error('uploadAsset unable to retrieve Storage Implementation from StorageFactory.getInstance()', LOG.LS.eGQL);
            return { status: UploadStatus.Failed, error: 'Storage unavailable' };
        }

        const { filename, createReadStream } = this.apolloFile;
        const WSResult: STORE.WriteStreamResult = await storage.writeStream(filename);
        if (WSResult.error || !WSResult.writeStream || !WSResult.storageKey) {
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
                    let commitResult: STORE.AssetStorageResultCommit;
                    if (!this.idAsset) { // create new asset and asset version
                        const ASCNAI: STORE.AssetStorageCommitNewAssetInput = {
                            storageKey,
                            storageHash: null,
                            FileName: filename,
                            FilePath: '',
                            idAssetGroup: 0,
                            idVAssetType: vocabulary.idVocabulary,
                            idUserCreator: this.user!.idUser, // eslint-disable-line @typescript-eslint/no-non-null-assertion
                            DateCreated: new Date()
                        };

                        commitResult = await STORE.AssetStorageAdapter.commitNewAsset(ASCNAI);
                    } else { // update existing asset with new asset version
                        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(this.idAsset);
                        if (!asset) {
                            const error: string = `uploadAsset unable to fetch asset ${this.idAsset}`;
                            LOG.error(error, LOG.LS.eGQL);
                            resolve({ status: UploadStatus.Failed, error });
                            return;
                        }
                        const ASCNAVI: STORE.AssetStorageCommitNewAssetVersionInput = {
                            storageKey,
                            storageHash: null,
                            asset,
                            assetNameOverride: filename,
                            idUserCreator: this.user!.idUser, // eslint-disable-line @typescript-eslint/no-non-null-assertion
                            DateCreated: new Date()
                        };
                        commitResult = await STORE.AssetStorageAdapter.commitNewAssetVersion(ASCNAVI);
                    }

                    if (!commitResult.success) {
                        LOG.error(`uploadAsset AssetStorageAdapter.commitNewAsset() failed: ${commitResult.error}`, LOG.LS.eGQL);
                        resolve({ status: UploadStatus.Failed, error: commitResult.error });
                    }
                    // commitResult.assets; commitResult.assetVersions; <-- These have been created
                    const { assetVersions } = commitResult;
                    if (assetVersions) {
                        this.workflowHelper = await this.createWorkflow(assetVersions);

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
                                const results = workflow ? await workflow.waitForCompletion(3600000) : { success: true, error: '' };
                                if (results.success) {
                                    idAssetVersions.push(assetVersion.idAssetVersion);
                                    if (assetVersion.Ingested === null) {
                                        assetVersion.Ingested = false;
                                        if (!await assetVersion.update())
                                            LOG.error('uploadAsset post-upload workflow suceeded, but unable to update asset version ingested flag', LOG.LS.eGQL);
                                    }
                                } else {
                                    await this.appendToWFReport(`uploadAsset post-upload workflow error: ${results.error}`, true, true);
                                    const SO: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject();
                                    if (SO) {
                                        if (!await SO.retireObject())
                                            LOG.error('uploadAsset post-upload workflow error handler failed to retire uploaded asset', LOG.LS.eGQL);
                                    } else
                                        LOG.error('uploadAsset post-upload workflow error handler failed to fetch system object for uploaded asset', LOG.LS.eGQL);
                                    success = false;
                                    error = 'Post-upload Workflow Failed';
                                }
                            }
                        }

                        if (success)
                            resolve({ status: UploadStatus.Complete, idAssetVersions });
                        else
                            resolve({ status: UploadStatus.Failed, error, idAssetVersions });
                    }
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

    async createWorkflow(assetVersions: DBAPI.AssetVersion[]): Promise<IWorkflowHelper> {
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

                const path: string = SOI ? RouteBuilder.RepositoryDetails(SOI.idSystemObject) : '';
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
        return { success: true, error: '', workflowEngine, workflow, workflowReport };
    }
}
