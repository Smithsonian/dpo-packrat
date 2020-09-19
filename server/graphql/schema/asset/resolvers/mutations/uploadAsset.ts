import { ReadStream } from 'fs';
import { MutationUploadAssetArgs, UploadAssetResult, UploadStatus /*, AssetType */ } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as STORE from '../../../../../storage/interface';
import * as LOG from '../../../../../utils/logger';
import * as CACHE from '../../../../../cache';
import * as DBAPI from '../../../../../db';

interface ApolloFile {
    filename: string;
    mimetype: string;
    encoding: string;
    createReadStream: () => ReadStream;
}

export default async function uploadAsset(_: Parent, args: MutationUploadAssetArgs, context: Context): Promise<UploadAssetResult | void> {
    const { user } = context;
    const { filename, createReadStream }: ApolloFile = await args.file;

    if (!user) {
        LOG.logger.error('GraphQL uploadAsset unable to retrieve user context');
        return { status: UploadStatus.Failed, error: 'User not authenticated' };
    }

    const storage: STORE.IStorage | null = await STORE.StorageFactory.getInstance(); /* istanbul ignore next */
    if (!storage) {
        LOG.logger.error('GraphQL uploadAsset unable to retrieve Storage Implementation from StorageFactory.getInstance()');
        return { status: UploadStatus.Failed, error: 'Storage unavailable' };
    }

    const WSResult: STORE.WriteStreamResult = await storage.writeStream(filename);
    if (WSResult.error || !WSResult.writeStream || !WSResult.storageKey) {
        LOG.logger.error(`GraphQL uploadAsset unable to retrieve IStorage.writeStream(): ${WSResult.error}`);
        return { status: UploadStatus.Failed, error: 'Storage unavailable' };
    }
    const { writeStream, storageKey } = WSResult;
    const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(args.type);
    if (!vocabulary) {
        LOG.logger.error('GraphQL uploadAsset unable to retrieve asset type vocabulary');
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
                    LOG.logger.error(`GraphQL uploadAsset AssetStorageAdapter.commitNewAsset() failed: ${commitResult.error}`);
                    resolve({ status: UploadStatus.Failed, error: commitResult.error });
                }
                // commitResult.assets; commitResult.assetVersions; <-- These have been created
                const { assetVersions } = commitResult;
                if (assetVersions) {
                    const idAssetVersions: number[] = [];
                    for (const assetVersion of assetVersions)
                        idAssetVersions.push(assetVersion.idAssetVersion);
                    resolve({ status: UploadStatus.Complete, idAssetVersions });
                }
            });

            stream.on('error', async () => {
                await storage.discardWriteStream({ storageKey });
                resolve({ status: UploadStatus.Failed, error: 'Upload failed' });
            });

            // stream.on('close', async () => { });
        });
    } catch (error) {
        LOG.logger.error('GraphQL uploadAsset', error);
        return { status: UploadStatus.Failed, error: 'Upload failed' };
    }
}
