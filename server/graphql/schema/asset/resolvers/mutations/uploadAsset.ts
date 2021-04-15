import { ReadStream } from 'fs';
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
        LOG.logger.error('GQL uploadAsset unable to retrieve user context');
        return { status: UploadStatus.Failed, error: 'User not authenticated' };
    }

    const { filename, createReadStream }: ApolloFile = await args.file;
    LOG.logger.info(`GQL uploadAsset ${filename}`);
    const storage: STORE.IStorage | null = await STORE.StorageFactory.getInstance(); /* istanbul ignore next */
    if (!storage) {
        LOG.logger.error('GQL uploadAsset unable to retrieve Storage Implementation from StorageFactory.getInstance()');
        return { status: UploadStatus.Failed, error: 'Storage unavailable' };
    }

    const WSResult: STORE.WriteStreamResult = await storage.writeStream(filename);
    if (WSResult.error || !WSResult.writeStream || !WSResult.storageKey) {
        LOG.logger.error(`GQL uploadAsset unable to retrieve IStorage.writeStream(): ${WSResult.error}`);
        return { status: UploadStatus.Failed, error: 'Storage unavailable' };
    }
    const { writeStream, storageKey } = WSResult;
    const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(args.type);
    if (!vocabulary) {
        LOG.logger.error('GQL uploadAsset unable to retrieve asset type vocabulary');
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

                const commitResult: STORE.AssetStorageResultCommit = await STORE.AssetStorageAdapter.commitNewAsset(ASCNAI);
                if (!commitResult.success) {
                    LOG.logger.error(`GQL uploadAsset AssetStorageAdapter.commitNewAsset() failed: ${commitResult.error}`);
                    resolve({ status: UploadStatus.Failed, error: commitResult.error });
                }
                // commitResult.assets; commitResult.assetVersions; <-- These have been created
                const { assetVersions } = commitResult;
                if (assetVersions) {
                    let success: boolean = true;
                    let error: string = '';
                    const workflowEngine: WF.IWorkflowEngine | null = await WF.WorkflowFactory.getInstance();
                    const idAssetVersions: number[] = [];
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
                        if (workflowEngine) {
                            // assetVersion.fetchSystemObject()
                            const sysInfo: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromAssetVersion(assetVersion);
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
                                        LOG.logger.error('GQL uploadAsset post-upload workflow suceeded, but unable to update asset version ingested flag');
                                }
                            } else {
                                LOG.logger.error(`GQL uploadAsset post-upload workflow error: ${results.error}`);
                                const SO: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject();
                                if (SO) {
                                    if (!await SO.retireObject())
                                        LOG.logger.error('GQL uploadAsset post-upload workflow error handler failed to retire uploaded asset');
                                } else
                                    LOG.logger.error('GQL uploadAsset post-upload workflow error handler failed to fetch system object for uploaded asset');
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
                await storage.discardWriteStream({ storageKey });
                resolve({ status: UploadStatus.Failed, error: 'Upload failed' });
            });

            // stream.on('close', async () => { });
        });
    } catch (error) {
        LOG.logger.error('GQL uploadAsset', error);
        return { status: UploadStatus.Failed, error: 'Upload failed' };
    }
}
