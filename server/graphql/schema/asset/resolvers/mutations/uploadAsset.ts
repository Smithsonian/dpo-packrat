import { ReadStream } from 'fs';
import { MutationUploadAssetArgs, UploadAssetResult, UploadStatus /*, AssetType */ } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
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

export default async function uploadAsset(_: Parent, args: MutationUploadAssetArgs): Promise<UploadAssetResult | void> {
    const storage: STORE.IStorage | null = await STORE.StorageFactory.getInstance(); /* istanbul ignore next */
    if (!storage) {
        LOG.logger.error('uploadAsset unable to retrieve Storage Implementation from StorageFactory.getInstance()');
        return { status: UploadStatus.Failed };
    }

    const WSResult: STORE.WriteStreamResult = await storage.writeStream();
    if (WSResult.error || !WSResult.writeStream || !WSResult.storageKey) {
        LOG.logger.error(`uploadAsset unable to retrieve IStorage.writeStream(): ${WSResult.error}`);
        return { status: UploadStatus.Failed };
    }
    const { writeStream, storageKey } = WSResult;
    // const type: AssetType = args.type; // TODO: this AssetType needs to be a Vocabulary.idVocabulary, or something that can be transformed into such an ID
    const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eAssetAssetTypeOther);
    if (!vocabulary) {
        LOG.logger.error('uploadAsset unable to retrieve asset type vocabulary');
        return { status: UploadStatus.Failed };
    }

    try {
        const { filename, createReadStream }: ApolloFile = await args.file;
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
                    idVAssetType: vocabulary.idVocabulary, // TODO: replace with VocabularyID for this assettype, per above TODO item
                    idUserCreator: 1, // TODO: replace with user ID
                    DateCreated: new Date()
                };

                const commitResult: STORE.AssetStorageResult = await STORE.AssetStorageAdapter.commitNewAsset(ASCNAI);
                if (!commitResult.success) {
                    LOG.logger.error(`uploadAsset AssetStorageAdapter.commitNewAsset() failed: ${commitResult.error}`);
                    resolve({ status: UploadStatus.Failed });
                }
                // commitResult.asset; commitResult.assetVersion; <-- These have been created
                resolve({ status: UploadStatus.Complete });
            });

            stream.on('error', async () => {
                await storage.discardWriteStream({ storageKey });
                resolve({ status: UploadStatus.Failed });
            });

            // stream.on('close', async () => { });
        });
    } catch (error) {
        LOG.logger.error('uploadAsset', error);
        return { status: UploadStatus.Failed };
    }
}
