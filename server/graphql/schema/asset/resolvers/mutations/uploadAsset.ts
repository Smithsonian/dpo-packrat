import { ReadStream } from 'fs-extra';
import { MutationUploadAssetArgs, UploadAssetResult, UploadStatus /*, AssetType */ } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as STORE from '../../../../../storage/interface';
import * as LOG from '../../../../../utils/logger';
import * as CACHE from '../../../../../cache';
import * as DBAPI from '../../../../../db';
import * as WF from '../../../../../workflow/interface';

interface ApolloFile {
    filename: string;
    mimetype: string;
    encoding: string;
    createReadStream: () => ReadStream;
}

export default async function uploadAsset(_: Parent, args: MutationUploadAssetArgs, context: Context): Promise<UploadAssetResult | void> {
    const { user } = context;
    if (!user) {
        LOG.error('uploadAsset unable to retrieve user context', LOG.LS.eGQL);
        return { status: UploadStatus.Failed, error: 'User not authenticated' };
    }

    const { filename, createReadStream }: ApolloFile = await args.file;
    const idAsset: number | undefined | null = args.idAsset;
    if (!idAsset)
        LOG.info(`uploadAsset ADD ${filename}`, LOG.LS.eGQL);
    else
        LOG.info(`uploadAsset UPD ${filename} for idAsset ${idAsset}`, LOG.LS.eGQL);

    const storage: STORE.IStorage | null = await STORE.StorageFactory.getInstance(); /* istanbul ignore next */
    if (!storage) {
        LOG.error('uploadAsset unable to retrieve Storage Implementation from StorageFactory.getInstance()', LOG.LS.eGQL);
        return { status: UploadStatus.Failed, error: 'Storage unavailable' };
    }

    const WSResult: STORE.WriteStreamResult = await storage.writeStream(filename);
    if (WSResult.error || !WSResult.writeStream || !WSResult.storageKey) {
        LOG.error(`uploadAsset unable to retrieve IStorage.writeStream(): ${WSResult.error}`, LOG.LS.eGQL);
        return { status: UploadStatus.Failed, error: 'Storage unavailable' };
    }
    const { writeStream, storageKey } = WSResult;
    const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(args.type);
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
                if (!idAsset) { // create new asset and asset version
                    const ASCNAI: STORE.AssetStorageCommitNewAssetInput = {
                        storageKey,
                        storageHash: null,
                        FileName: filename,
                        FilePath: '',
                        idAssetGroup: 0,
                        idVAssetType: vocabulary.idVocabulary,
                        idUserCreator: user.idUser,
                        DateCreated: new Date()
                    };

                    commitResult = await STORE.AssetStorageAdapter.commitNewAsset(ASCNAI);
                } else { // update existing asset with new asset version
                    const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(idAsset);
                    if (!asset) {
                        const error: string = `uploadAsset unable to fetch asset ${idAsset}`;
                        LOG.error(error, LOG.LS.eGQL);
                        resolve({ status: UploadStatus.Failed, error });
                        return;
                    }
                    commitResult = await STORE.AssetStorageAdapter.commitNewAssetVersion({ storageKey, storageHash: null }, asset, user.idUser, new Date());
                }

                if (!commitResult.success) {
                    LOG.error(`uploadAsset AssetStorageAdapter.commitNewAsset() failed: ${commitResult.error}`, LOG.LS.eGQL);
                    resolve({ status: UploadStatus.Failed, error: commitResult.error });
                }
                // commitResult.assets; commitResult.assetVersions; <-- These have been created
                const { assetVersions } = commitResult;
                if (assetVersions) {
                    let success: boolean = true;
                    let error: string = '';
                    const workflowEngine: WF.IWorkflowEngine | null = await WF.WorkflowFactory.getInstance();
                    const idAssetVersions: number[] = [];
                    if (workflowEngine) {
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
                                idUserInitiator: user.idUser,
                                parameters: null
                            };

                            const workflow: WF.IWorkflow | null = await workflowEngine.event(CACHE.eVocabularyID.eWorkflowEventIngestionUploadAssetVersion, workflowParams);
                            const results = workflow ? await workflow.waitForCompletion(3600000) : { success: true, error: '' };
                            if (results.success) {
                                idAssetVersions.push(assetVersion.idAssetVersion);
                                if (assetVersion.Ingested === null) {
                                    assetVersion.Ingested = false;
                                    if (!await assetVersion.update())
                                        LOG.error('uploadAsset post-upload workflow suceeded, but unable to update asset version ingested flag', LOG.LS.eGQL);
                                }
                            } else {
                                LOG.error(`uploadAsset post-upload workflow error: ${results.error}`, LOG.LS.eGQL);
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
                LOG.error('uploadAsset, Upload failed', LOG.LS.eGQL);
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
