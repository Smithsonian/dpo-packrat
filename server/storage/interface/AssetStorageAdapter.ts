import * as path from 'path';
import * as STORE from '../interface';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as LOG from '../../utils/logger';
import { ZipFile, ZipStream, IOResults, IZip } from '../../utils';
import { BagitReader } from '../../utils/parser';
import { StorageFactory } from './StorageFactory';
import { IStorage } from './IStorage';
import { AssetVersionContent } from '../../types/graphql';

export type AssetStorageResult = {
    asset: DBAPI.Asset | null,
    assetVersion: DBAPI.AssetVersion | null,
    success: boolean,
    error: string
};

export type AssetStorageCommitNewAssetInput = {
    storageKey: string;
    storageHash: string | null;
    FileName: string;
    FilePath: string;
    idAssetGroup: number | null;
    idVAssetType: number;
    idUserCreator: number;
    DateCreated: Date;
};

/**
    The AssetStorageAdapter provides a DBAPI-based bridge to the storage interface,
    enabling the storage system to know nothing about the DB.

    Usage synopsis (don't forget error handling, logging, null checking, etc.!)
    *******************************************************
    (1) Uploading a file to staging storage for a new asset
    *******************************************************
    const storage: IStorage | null = await StorageFactory.getInstance();                                // get storage interface
    const wsRes: WriteStreamResult = await storage.writeStream();                                       // get write stream from storage interface
    const { writeStream, storageKey } = wsRes;
    // write bits to writeStream; save storageKey
    const comRes: AssetStorageResult = await AssetStorageAdapter.commitNewAsset({ storageKey,...}});    // commit uploads bits to staging storage
    // comRes.asset; comRes.assetVersion; <-- These have been created
 */
export class AssetStorageAdapter {
    static async readAsset(asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion): Promise<STORE.ReadStreamResult> {
        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            const error: string = 'AssetStorageAdapter.readAsset: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            LOG.logger.error(error);
            return { readStream: null, storageHash: null, success: false, error };
        }

        const { storageKey, ingested, error } = AssetStorageAdapter.computeStorageKeyAndIngested(asset, assetVersion); ingested; /* istanbul ignore next */
        if (!storageKey) {
            LOG.logger.error(error);
            return { readStream: null, storageHash: null, success: false, error };
        }

        const readStreamInput: STORE.ReadStreamInput = {
            storageKey,
            fileName: asset.FileName,
            version: assetVersion.Version,
            staging: !assetVersion.Ingested
        };

        return await storage.readStream(readStreamInput);
    }

    /**
     * Commits Storage WriteStream
     * Creates and persists Asset and AssetVersion
     */
    static async commitNewAsset(commitNewAssetInput: AssetStorageCommitNewAssetInput): Promise<AssetStorageResult> {
        const { storageKey, storageHash, FileName, FilePath, idAssetGroup, idVAssetType, idUserCreator, DateCreated } = commitNewAssetInput;
        const asset: DBAPI.Asset = new DBAPI.Asset({
            FileName,
            FilePath,
            idAssetGroup,
            idVAssetType,
            idSystemObject: null,
            StorageKey: null,
            idAsset: 0
        });

        return await AssetStorageAdapter.commitNewAssetVersion({ storageKey, storageHash }, asset, idUserCreator, DateCreated);
    }

    /**
     * Commits Storage WriteStream
     * Creates and persists AssetVersion (and Asset if Asset.idAsset is 0)
     */
    static async commitNewAssetVersion(commitWriteStreamInput: STORE.CommitWriteStreamInput,
        asset: DBAPI.Asset, idUserCreator: number, DateCreated: Date):
        Promise<AssetStorageResult> {
        const retValue: AssetStorageResult = {
            asset: null,
            assetVersion: null,
            success: false,
            error: ''
        };

        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            retValue.success = false;
            retValue.error = 'AssetStorageAdapter.commitNewAssetVersion: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            LOG.logger.error(retValue.error);
            return retValue;
        }

        const resStorage: STORE.CommitWriteStreamResult = await storage.commitWriteStream(commitWriteStreamInput);
        if (!resStorage.success) {
            retValue.success = false;
            retValue.error = resStorage.error;
            LOG.logger.error(retValue.error);
            return retValue;
        }

        // Create Asset if necessary
        if (asset.idAsset == 0) {
            /* istanbul ignore if */
            if (!await asset.create()) {
                retValue.success = false;
                retValue.error = `AssetStorageAdapter.commitNewAssetVersion: Unable to create Asset ${JSON.stringify(asset)}`;
                LOG.logger.error(retValue.error);
                return retValue;
            }
        }

        const assetVersion: DBAPI.AssetVersion = new DBAPI.AssetVersion({
            idAsset: asset.idAsset,
            Version: 1, /* ignored */
            FileName: asset.FileName,
            idUserCreator,
            DateCreated,
            StorageHash: resStorage.storageHash ? resStorage.storageHash : /* istanbul ignore next */ '',
            StorageSize: resStorage.storageSize ? resStorage.storageSize : /* istanbul ignore next */ 0,
            StorageKeyStaging: commitWriteStreamInput.storageKey,
            Ingested: false,
            idAssetVersion: 0
        });

        /* istanbul ignore if */
        if (!await assetVersion.create()) {
            retValue.success = false;
            retValue.error = `AssetStorageAdapter.commitNewAssetVersion: Unable to create AssetVersion ${JSON.stringify(assetVersion)}`;
            LOG.logger.error(retValue.error);
            return retValue;
        }
        retValue.asset = asset;
        retValue.assetVersion = assetVersion;
        retValue.success = true;
        return retValue;
    }

    static async ingestAsset(asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion,
        SOBased: DBAPI.SystemObjectBased, opInfo: STORE.OperationInfo): Promise<AssetStorageResult> {
        const SO: DBAPI.SystemObject | null = await SOBased.fetchSystemObject();
        /* istanbul ignore if */
        if (!SO) {
            const error: string = `Unable to fetch SystemObject for ${SO}`;
            LOG.logger.error(error);
            return {
                asset,
                assetVersion,
                success: false,
                error
            };
        }
        return await AssetStorageAdapter.ingestAssetForSystemObjectID(asset, assetVersion, SO.idSystemObject, opInfo);
    }

    static async ingestAssetForSystemObjectID(asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion,
        idSystemObject: number, opInfo: STORE.OperationInfo): Promise<AssetStorageResult> {
        // Call IStorage.promote
        // Update asset.StorageKey, if needed
        // Update assetVersion.Ingested to true
        const retValue: AssetStorageResult = {
            asset,
            assetVersion,
            success: false,
            error: ''
        };

        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            retValue.success = false;
            retValue.error = 'AssetStorageAdapter.ingestAsset: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            LOG.logger.error(retValue.error);
            return retValue;
        }

        let storageKey: string = (asset.idAsset > 0 && asset.StorageKey) ? asset.StorageKey : '';
        if (!storageKey) {
            const storageKeyResults = await storage.computeStorageKey(asset.idAsset.toString()); /* istanbul ignore next */
            if (!storageKeyResults.success) {
                retValue.success = false;
                retValue.error = storageKeyResults.error;
                LOG.logger.error(retValue.error);
                return retValue;
            } else
                storageKey = storageKeyResults.storageKey;
        }

        const metadata: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(idSystemObject, DBAPI.eObjectGraphMode.eAncestors); /* istanbul ignore next */
        if (!await metadata.fetch()) {
            retValue.success = false;
            retValue.error = `AssetStorageAdapter.ingestAsset: Update to retrieve object ancestry for system object ${idSystemObject}`;
            LOG.logger.error(retValue.error);
            return retValue;
        }

        const promoteStagedAssetInput: STORE.PromoteStagedAssetInput = {
            storageKeyStaged: assetVersion.StorageKeyStaging,
            storageKeyFinal: storageKey,
            fileName: asset.FileName,
            metadata,
            opInfo
        };

        const resStorage = await storage.promoteStagedAsset(promoteStagedAssetInput);
        if (!resStorage.success) {
            retValue.success = false;
            retValue.error = resStorage.error;
            LOG.logger.error(retValue.error);
            return retValue;
        }

        // Update Asset if new information is being provided here
        // StorageKey should be updated only the first time we ingest
        let updateAsset: boolean = false;
        if (asset.idSystemObject != idSystemObject) {
            asset.idSystemObject = idSystemObject;
            updateAsset = true;
        }
        if (asset.StorageKey != storageKey) {
            asset.StorageKey = storageKey;
            updateAsset = true;
        }
        if (updateAsset) /* istanbul ignore next */ {
            if (!await asset.update()) {
                retValue.success = false;
                retValue.error = `AssetStorageAdapter.ingestAsset: Update to update Asset ${JSON.stringify(asset)}`;
                LOG.logger.error(retValue.error);
                return retValue;
            }
        }

        assetVersion.Ingested = true;
        assetVersion.StorageKeyStaging = ''; /* istanbul ignore next */
        if (!await assetVersion.update()) {
            retValue.success = false;
            retValue.error = `AssetStorageAdapter.ingestAsset: Update to update AssetVersion ${JSON.stringify(assetVersion)}`;
            LOG.logger.error(retValue.error);
            return retValue;
        }

        retValue.success = true;
        return retValue;
    }

    static async renameAsset(asset: DBAPI.Asset, fileNameNew: string, opInfo: STORE.OperationInfo): Promise<AssetStorageResult> {
        const renameAssetInput: STORE.RenameAssetInput = {
            storageKey: asset.StorageKey ? asset.StorageKey : /* istanbul ignore next */ '',
            fileNameOld: asset.FileName,
            fileNameNew,
            opInfo
        };

        const ASR: STORE.AssetStorageResult = await this.actOnAssetWorker(asset, opInfo, renameAssetInput, null, null);
        /* istanbul ignore else */
        if (ASR.success) {
            // TODO: handle later failures by rolling back storage system change
            asset.FileName = fileNameNew; /* istanbul ignore next */
            if (!await asset.update())
                return {
                    success: false,
                    error: `AssetStorageAdapter.renameAsset: Unable to update Asset.FileName ${JSON.stringify(asset)}`,
                    asset,
                    assetVersion: null
                };
        }
        return ASR;
    }

    static async hideAsset(asset: DBAPI.Asset, opInfo: STORE.OperationInfo): Promise<AssetStorageResult> {
        const hideAssetInput: STORE.HideAssetInput = {
            storageKey: asset.StorageKey ? asset.StorageKey : /* istanbul ignore next */ '',
            fileName: asset.FileName,
            opInfo
        };
        const ASR = await this.actOnAssetWorker(asset, opInfo, null, hideAssetInput, null);
        /* istanbul ignore else */
        if (ASR.success) {
            // TODO: handle later failures by rolling back storage system change
            // Mark this asset as retired
            const SO: DBAPI.SystemObject | null = await asset.fetchSystemObject(); /* istanbul ignore next */
            if (SO == null)
                return {
                    success: false,
                    error: `AssetStorageAdapter.hideAsset: Unable to retrieve SystemObject for Asset ${JSON.stringify(asset)}`,
                    asset,
                    assetVersion: null
                };

            /* istanbul ignore next */
            if (!await SO.retireObject())
                return {
                    success: false,
                    error: `AssetStorageAdapter.hideAsset: Unable to mark SystemObject as retired for Asset ${JSON.stringify(asset)}`,
                    asset,
                    assetVersion: null
                };
        }
        return ASR;
    }

    static async reinstateAsset(asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion | null, opInfo: STORE.OperationInfo): Promise<AssetStorageResult> {
        const reinstateAssetInput: STORE.ReinstateAssetInput = {
            storageKey: asset.StorageKey ? asset.StorageKey : /* istanbul ignore next */ '',
            fileName: assetVersion ? assetVersion.FileName : asset.FileName,
            version: assetVersion ? assetVersion.Version : -1, // -1 means the most recent version
            opInfo
        };
        const ASR = await this.actOnAssetWorker(asset, opInfo, null, null, reinstateAssetInput);
        /* istanbul ignore else */
        if (ASR.success) {
            // TODO: handle later failures by rolling back storage system change
            // Mark this asset as not retired
            const SO: DBAPI.SystemObject | null = await asset.fetchSystemObject(); /* istanbul ignore next */
            if (SO == null)
                return {
                    success: false,
                    error: `AssetStorageAdapter.reinstateAsset: Unable to retrieve SystemObject for Asset ${JSON.stringify(asset)}`,
                    asset,
                    assetVersion
                };
            /* istanbul ignore next */
            if (!await SO.reinstateObject())
                return {
                    success: false,
                    error: `AssetStorageAdapter.reinstateAsset: Unable to mark SystemObject as not retired for Asset ${JSON.stringify(asset)}`,
                    asset,
                    assetVersion
                };
        }

        return ASR;
    }

    private static async actOnAssetWorker(asset: DBAPI.Asset, opInfo: STORE.OperationInfo,
        renameAssetInput: STORE.RenameAssetInput | null,
        hideAssetInput: STORE.HideAssetInput | null,
        reinstateAssetInput: STORE.ReinstateAssetInput | null): Promise<AssetStorageResult> {

        /* istanbul ignore next */
        if (!asset.StorageKey) {
            const error: string = `AssetStorageAdapter.actOnAssetWorker: Asset ${JSON.stringify(asset)} has null storageKey`;
            LOG.logger.error(error);
            return { success: false, error, asset, assetVersion: null };
        }

        const retValue: AssetStorageResult = {
            asset,
            assetVersion: null,
            success: false,
            error: ''
        };
        let fileNameNew: string = '';

        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            retValue.success = false;
            retValue.error = 'AssetStorageAdapter.actOnAssetWorker: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            LOG.logger.error(retValue.error);
            return retValue;
        }

        // Read most recent AssetVersion
        const assetVersionOld: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(asset.idAsset); /* istanbul ignore next */
        if (!assetVersionOld) {
            retValue.success = false;
            retValue.error = `AssetStorageAdapter.actOnAssetWorker: Unable to fetch latest AssetVersion for ${asset}`;
            LOG.logger.error(retValue.error);
            return retValue;
        }

        if (renameAssetInput) {
            const renameAssetResult = await storage.renameAsset(renameAssetInput); /* istanbul ignore next */
            if (!renameAssetResult.success) {
                retValue.success = false;
                retValue.error = renameAssetResult.error;
                LOG.logger.error(retValue.error);
                return retValue;
            }
            fileNameNew = renameAssetInput.fileNameNew;
        } else if (hideAssetInput) {
            const hideAssetResult = await storage.hideAsset(hideAssetInput); /* istanbul ignore next */
            if (!hideAssetResult.success) {
                retValue.success = false;
                retValue.error = hideAssetResult.error;
                LOG.logger.error(retValue.error);
                return retValue;
            }
        } else /* istanbul ignore next */ if (reinstateAssetInput) {
            const reinstateAssetResult = await storage.reinstateAsset(reinstateAssetInput);
            if (!reinstateAssetResult.success) {
                retValue.success = false;
                retValue.error = reinstateAssetResult.error;
                LOG.logger.error(retValue.error);
                return retValue;
            }
        }

        // Create new AssetVersion
        const assetVersion: DBAPI.AssetVersion = new DBAPI.AssetVersion({
            idAsset: asset.idAsset,
            Version: 1, /* ignored */
            FileName: fileNameNew ? fileNameNew : assetVersionOld.FileName,
            idUserCreator: opInfo.idUser,
            DateCreated: new Date(),
            StorageHash: assetVersionOld.StorageHash,
            StorageSize: assetVersionOld.StorageSize,
            StorageKeyStaging: assetVersionOld.StorageKeyStaging,
            Ingested: assetVersionOld.Ingested,
            idAssetVersion: 0
        });

        /* istanbul ignore next */
        if (!await assetVersion.create()) {
            retValue.success = false;
            retValue.error = `AssetStorageAdapter.actOnAssetWorker: Unable to create AssetVersion ${JSON.stringify(assetVersion)}`;
            LOG.logger.error(retValue.error);
            return retValue;
        }
        retValue.asset = asset;
        retValue.assetVersion = assetVersion;
        retValue.success = true;
        return retValue;
    }

    private static computeStorageKeyAndIngested(asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion): { storageKey: string | null, ingested: boolean, error: string } {
        let storageKey: string | null = null;
        const ingested: boolean = assetVersion.Ingested;
        let error: string = '';
        if (ingested) { /* istanbul ignore next */
            if (!asset.StorageKey) {
                error = `AssetStorageAdapter.computeStorageKeyAndIngested: Asset ${JSON.stringify(asset)} has null storageKey`;
                LOG.logger.error(error);
                return { storageKey, ingested, error };
            }
            storageKey = asset.StorageKey;
        } else
            storageKey = assetVersion.StorageKeyStaging;
        return { storageKey, ingested, error };
    }

    static async getAssetVersionContents(assetVersion: DBAPI.AssetVersion): Promise<AssetVersionContent> {
        const retValue = {
            idAssetVersion: assetVersion.idAssetVersion,
            folders: new Array<string>(),
            all: new Array<string>()
        };

        // if our filename is not a zip, just return it!
        if (!assetVersion.FileName.toLowerCase().endsWith('.zip')) {
            retValue.all.push(assetVersion.FileName);
            return retValue;
        }

        // otherwise, we need to do the following:
        // 1. retrieve the associated asset
        // 2. determine if this is a plain old zip or a bagit bulk ingestion file (determined from asset.idVAssetType)
        // 3. determine the storage key and whether it's staging or repository
        // 4a. for repository, construct either a ZipStream (plain old zip) or a BagitReader (based on a zip stream)
        // 4b. for staging, construct either a ZipFile (plain old zip) or a BagitReader (based on a zip file)
        // 5. use the constructed object to compute contents
        // 6. close the object

        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset); /* istanbul ignore next */
        if (!asset) {
            LOG.logger.error(`AssetStorageAdapter.getAssetVersionContents unable to compute asset for AssetVersion ${JSON.stringify(assetVersion)} `);
            return retValue;
        }

        const vocabBulkIngest: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eAssetAssetTypeBulkIngestion);
        const isBulkIngest: boolean = (vocabBulkIngest && asset.idVAssetType == vocabBulkIngest.idVocabulary) ? true : false;

        const { storageKey, ingested, error } = AssetStorageAdapter.computeStorageKeyAndIngested(asset, assetVersion); /* istanbul ignore next */
        if (!storageKey) {
            LOG.logger.error(error);
            return retValue;
        }

        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            const error: string = 'AssetStorageAdapter.getAssetVersionContents: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            LOG.logger.error(error);
            return retValue;
        }

        // LOG.logger.info(`getAssetVersionContents fileName ${assetVersion.FileName} storageKey ${storageKey} ingested ${ingested} isBulkIngest ${isBulkIngest}`);
        let reader: IZip;
        if (ingested) {
            // ingested content lives on isilon storage; we'll need to stream it back to the server for processing
            const readStreamInput: STORE.ReadStreamInput = {
                storageKey,
                fileName: asset.FileName,
                version: assetVersion.Version,
                staging: !assetVersion.Ingested
            };

            const RSR: STORE.ReadStreamResult = await storage.readStream(readStreamInput); /* istanbul ignore next */
            if (!RSR.success|| !RSR.readStream) {
                LOG.logger.error(RSR.error);
                return retValue;
            }

            reader = (isBulkIngest)
                ? new BagitReader({ zipFileName: null, zipStream: RSR.readStream, directory: null, validate: true, validateContent: false })
                : new ZipStream(RSR.readStream);
        } else {
            // non-ingested content is staged locally
            const stagingFileName: string = await storage.stagingFileName(storageKey);
            reader = (isBulkIngest)
                ? new BagitReader({ zipFileName: stagingFileName, zipStream: null, directory: null, validate: true, validateContent: false })
                : new ZipFile(stagingFileName);
        }

        const ioResults: IOResults = await reader.load(); /* istanbul ignore next */
        if (!ioResults.success) {
            await reader.close();
            LOG.logger.error(ioResults.error);
            return retValue;
        }

        // for the time being, we handle bagit content differently than zip content
        // bagits (isBulkIngest) use getJustFiles() to report the contents of the data folder, and getJustDirectories() to report the directories in the data folder
        // zips give us everything
        if (isBulkIngest) {
            retValue.all = await reader.getJustFiles();
            retValue.folders = await reader.getJustDirectories();
        } else {
            const directoryMap: Map<string, boolean> = new Map<string, boolean>();
            const allEntries: string[] = await reader.getAllEntries();
            for (const entry of allEntries) {
                if (entry.endsWith('/'))
                    continue;
                const dirName: string = path.dirname(entry);
                if (!directoryMap.has(dirName) && dirName != '.') {
                    retValue.folders.push(dirName);
                    directoryMap.set(dirName, true);
                }
                const baseName: string = path.basename(entry);
                retValue.all.push(baseName);
                // LOG.logger.info(`Entry ${entry}: Dir ${dirName}; Base ${baseName}`);
            }
        }

        await reader.close();
        return retValue;
    }
}