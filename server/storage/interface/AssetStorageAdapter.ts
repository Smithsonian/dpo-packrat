/* eslint-disable @typescript-eslint/no-explicit-any */
import * as path from 'path';
import * as STORE from '../interface';
import * as DBAPI from '../../db';
import * as LOG from '../../utils/logger';
import { ZipFile, ZipStream, IOResults, IZip } from '../../utils';
import { BagitReader, BulkIngestReader } from '../../utils/parser';
import { StorageFactory } from './StorageFactory';
import { IStorage } from './IStorage';
import { AssetVersionContent } from '../../types/graphql';
import { eVocabularyID, VocabularyCache } from '../../cache';

export type AssetStorageResult = {
    asset: DBAPI.Asset | null,
    assetVersion: DBAPI.AssetVersion | null,
    success: boolean,
    error: string
};

export type AssetStorageResultCommit = {
    assets: DBAPI.Asset[] | null,
    assetVersions: DBAPI.AssetVersion[] | null,
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

export type CrackAssetResult = {
    success: boolean;
    error: string;
    zip: IZip | null;
    isBagit: boolean;
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
    // comRes.assets; comRes.assetVersions; <-- These have been created; when a bulk ingest file is uploaded, multiple assets and assetVersions may be created
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
    static async commitNewAsset(commitNewAssetInput: AssetStorageCommitNewAssetInput): Promise<AssetStorageResultCommit> {
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
        Promise<AssetStorageResultCommit> {

        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            const error: string = 'AssetStorageAdapter.commitNewAssetVersion: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            LOG.logger.error(error);
            return { assets: null, assetVersions: null, success: false, error };
        }

        const resStorage: STORE.CommitWriteStreamResult = await storage.commitWriteStream(commitWriteStreamInput);
        if (!resStorage.success) {
            LOG.logger.error(resStorage.error);
            return { assets: null, assetVersions: null, success: false, error: resStorage.error };
        }

        // detect & handle bulk ingest
        const isBulkIngest: boolean = (await asset.assetType() == eVocabularyID.eAssetAssetTypeBulkIngestion);
        return (isBulkIngest)
            ? await AssetStorageAdapter.commitNewAssetVersionBulk(commitWriteStreamInput, asset, idUserCreator, DateCreated, resStorage, storage)
            : await AssetStorageAdapter.commitNewAssetVersionNonBulk(commitWriteStreamInput, asset, idUserCreator, DateCreated, resStorage);
    }

    private static async commitNewAssetVersionNonBulk(commitWriteStreamInput: STORE.CommitWriteStreamInput,
        asset: DBAPI.Asset, idUserCreator: number, DateCreated: Date, resStorage: STORE.CommitWriteStreamResult):
        Promise<AssetStorageResultCommit> {

        const assetVersion: DBAPI.AssetVersion | null = await AssetStorageAdapter.createAssetConstellation(asset, idUserCreator,
            DateCreated, resStorage, commitWriteStreamInput.storageKey, false, null);

        if (assetVersion)
            return { assets: [ asset ], assetVersions: [ assetVersion ], success: true, error: '' };
        else
            return { assets: null, assetVersions: null, success: false, error: 'AssetStorageAdapter.commitNewAssetVersionNonBulk unable to create assets & asset versions' };
    }

    // split bulk ingest into separate assets and asset versions, one per system object in the bulk ingest
    private static async commitNewAssetVersionBulk(commitWriteStreamInput: STORE.CommitWriteStreamInput,
        asset: DBAPI.Asset, idUserCreator: number, DateCreated: Date, resStorage: STORE.CommitWriteStreamResult,
        storage: IStorage): Promise<AssetStorageResultCommit> {

        // Compute path to bagit zip; crack it open; pass it off to bulkIngestReader
        const stagingFileName: string = await storage.stagingFileName(commitWriteStreamInput.storageKey);
        const bagitZip: IZip = new BagitReader({ zipFileName: stagingFileName, zipStream: null, directory: null, validate: true, validateContent: false });
        let loadResults: IOResults = await bagitZip.load();
        if (!loadResults.success) {
            LOG.logger.error(loadResults.error);
            return { assets: null, assetVersions: null, success: false, error: loadResults.error };
        }

        const bulkIngestReader: BulkIngestReader = new BulkIngestReader();
        loadResults = await bulkIngestReader.loadFromZip(bagitZip, true);
        if (!loadResults.success) {
            LOG.logger.error(loadResults.error);
            return { assets: null, assetVersions: null, success: false, error: loadResults.error };
        }

        /*
        // create an asset group for these bulk ingested assets
        const assetGroup: DBAPI.AssetGroup = new DBAPI.AssetGroup({ idAssetGroup: 0 });
        if (!await assetGroup.create()) {
            LOG.logger.error(loadResults.error);
            return { assets: null, assetVersions: null, success: false, error: 'AssetStorageAdapter.commitNewAssetVersionBulk unable to create AssetGroup' };
        }
        asset.idAssetGroup = assetGroup.idAssetGroup;
        */
        const assets: DBAPI.Asset[] = [];
        const assetVersions: DBAPI.AssetVersion[] = [];

        // process objects; for each, create an asset, asset version, and metadata attached to the assetversion; set asset FilePath to the path within the zip of interest
        for (const ingestedObject of bulkIngestReader.ingestedObjects) {
            const assetClone: DBAPI.Asset = new DBAPI.Asset({ ...asset });
            assetClone.FilePath = ingestedObject.directory || '';

            let eVocabID: eVocabularyID = eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry;
            if (BulkIngestReader.ingestedObjectIsPhotogrammetry(ingestedObject))
                eVocabID = eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry;
            else if (BulkIngestReader.ingestedObjectIsModel(ingestedObject))
                eVocabID = eVocabularyID.eAssetAssetTypeModel;

            if (!await assetClone.setAssetType(eVocabID))
                return { assets: null, assetVersions: null, success: false, error: 'AssetStorageAdapter.commitNewAssetVersionBulk unable to create assets & asset versions' };

            const assetVersion: DBAPI.AssetVersion | null = await AssetStorageAdapter.createAssetConstellation(assetClone, idUserCreator,
                DateCreated, resStorage, commitWriteStreamInput.storageKey, true, ingestedObject);
            if (assetVersion) {
                assets.push(assetClone);
                assetVersions.push(assetVersion);
            } else
                return { assets: null, assetVersions: null, success: false, error: 'AssetStorageAdapter.commitNewAssetVersionBulk unable to create assets & asset versions' };
        }

        return { assets, assetVersions, success: true, error: '' };
    }

    private static async createAssetConstellation(asset: DBAPI.Asset, idUserCreator: number,
        DateCreated: Date, resStorage: STORE.CommitWriteStreamResult, storageKey: string,
        IsBagit: boolean, metaObject: any): Promise<DBAPI.AssetVersion | null> {
        if (asset.idAsset == 0) {
            /* istanbul ignore if */
            if (!await asset.create()) {
                const error: string = `AssetStorageAdapter.createAssetAndVersion: Unable to create Asset ${JSON.stringify(asset)}`;
                LOG.logger.error(error);
                return null;
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
            StorageKeyStaging: storageKey,
            Ingested: false,
            IsBagit,
            idAssetVersion: 0
        });

        /* istanbul ignore if */
        if (!await assetVersion.create()) {
            const error: string = `AssetStorageAdapter.commitNewAssetVersion: Unable to create AssetVersion ${JSON.stringify(assetVersion)}`;
            LOG.logger.error(error);
            return null;
        }

        const SO: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject();
        if (!SO) {
            const error: string = `AssetStorageAdapter.commitNewAssetVersion: Unable to fetch system object for AssetVersion ${JSON.stringify(assetVersion)}`;
            LOG.logger.error(error);
            return null;
        }

        if (metaObject) {
            const vocabulary: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(eVocabularyID.eMetadataMetadataSourceBulkIngestion);
            const metadata: DBAPI.Metadata = new DBAPI.Metadata({
                Name: 'Bulk Ingestion',
                ValueShort: null,
                ValueExtended: JSON.stringify(metaObject),
                idAssetValue: null,
                idUser: idUserCreator,
                idVMetadataSource: vocabulary ? vocabulary.idVocabulary : null,
                idSystemObject: SO.idSystemObject,
                idMetadata: 0
            });

            if (!await metadata.create()) {
                const error: string = `AssetStorageAdapter.commitNewAssetVersion: Unable to create metadata for AssetVersion ${JSON.stringify(assetVersion)}`;
                LOG.logger.error(error);
                return null;
            }
        }

        return assetVersion;
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
        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            const error: string = 'AssetStorageAdapter.ingestAsset: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            LOG.logger.error(error);
            return { asset, assetVersion, success: false, error };
        }

        let storageKey: string = (asset.idAsset > 0 && asset.StorageKey) ? asset.StorageKey : '';
        if (!storageKey) {
            const storageKeyResults = await storage.computeStorageKey(asset.idAsset.toString()); /* istanbul ignore next */
            if (!storageKeyResults.success) {
                LOG.logger.error(storageKeyResults.error);
                return { asset, assetVersion, success: false, error: storageKeyResults.error };
            } else
                storageKey = storageKeyResults.storageKey;
        }

        const metadata: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(idSystemObject, DBAPI.eObjectGraphMode.eAncestors); /* istanbul ignore next */
        if (!await metadata.fetch()) {
            const error: string = `AssetStorageAdapter.ingestAsset: Update to retrieve object ancestry for system object ${idSystemObject}`;
            LOG.logger.error(error);
            return { asset, assetVersion, success: false, error };
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
            LOG.logger.error(resStorage.error);
            return { asset, assetVersion, success: false, error: resStorage.error };
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
                const error: string = `AssetStorageAdapter.ingestAsset: Unable to update Asset ${JSON.stringify(asset)}`;
                LOG.logger.error(error);
                return { asset, assetVersion, success: false, error };
            }
        }

        assetVersion.Ingested = true;
        assetVersion.StorageKeyStaging = ''; /* istanbul ignore next */
        if (!await assetVersion.update()) {
            const error: string = `AssetStorageAdapter.ingestAsset: Unable to update AssetVersion ${JSON.stringify(assetVersion)}`;
            LOG.logger.error(error);
            return { asset, assetVersion, success: false, error };
        }

        return { asset, assetVersion, success: true, error: '' };
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

    /** Cracks open the file associated with assetVersion in an efficient manner.
     * Caller must call 'await CrackAssetResult.zip.close()' if the returned zip is not null. */
    static async crackAsset(assetVersion: DBAPI.AssetVersion): Promise<CrackAssetResult> {
        // if our filename is not a zip, return failure
        if (!assetVersion.FileName.toLowerCase().endsWith('.zip'))
            return { success: false, error: 'AssetStorageAdapter.crackAsset asked to crack a non-archive file', zip: null, isBagit: false };

        // 1. retrieve the associated asset
        // 2. determine if this is a plain old zip or a bagit bulk ingestion file (determined from asset.idVAssetType)
        // 3. determine the storage key and whether it's staging or repository
        // 4a. for repository, construct either a ZipStream (plain old zip) or a BagitReader (based on a zip stream)
        // 4b. for staging, construct either a ZipFile (plain old zip) or a BagitReader (based on a zip file)
        // 5. use the constructed object to compute contents
        // 6. close the object

        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset); /* istanbul ignore next */
        if (!asset) {
            const error: string = `AssetStorageAdapter.crackAsset unable to compute asset for AssetVersion ${JSON.stringify(assetVersion)}`;
            LOG.logger.error(error);
            return { success: false, error, zip: null, isBagit: false };
        }

        const { storageKey, ingested, error } = AssetStorageAdapter.computeStorageKeyAndIngested(asset, assetVersion); /* istanbul ignore next */
        if (!storageKey) {
            LOG.logger.error(error);
            return { success: false, error, zip: null, isBagit: false };
        }

        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            const error: string = 'AssetStorageAdapter.crackAsset: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            LOG.logger.error(error);
            return { success: false, error, zip: null, isBagit: false };
        }

        const isBulkIngest: boolean = assetVersion.IsBagit || (await asset.assetType() == eVocabularyID.eAssetAssetTypeBulkIngestion);
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
                return { success: false, error: RSR.error, zip: null, isBagit: false };
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

        try {
            const ioResults: IOResults = await reader.load(); /* istanbul ignore next */
            if (!ioResults.success) {
                await reader.close();
                LOG.logger.error(ioResults.error);
                return { success: false, error: ioResults.error, zip: null, isBagit: false };
            }
        } catch (error) {
            await reader.close();
            LOG.logger.error('AssetStorageAdapter.crackAsset', error);
            return { success: false, error: `AssetStorageAdapter.crackAsset ${JSON.stringify(error)}`, zip: null, isBagit: false };
        }
        return { success: true, error: '', zip: reader, isBagit: isBulkIngest };
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

        const ASC: CrackAssetResult = await AssetStorageAdapter.crackAsset(assetVersion);
        if (!ASC.success || !ASC.zip)
            return retValue;

        // for the time being, we handle bagit content differently than zip content
        // bagits (isBulkIngest) use getJustFiles() to report the contents of the data folder, and getJustDirectories() to report the directories in the data folder
        // zips give us everything
        if (ASC.isBagit) {
            retValue.all = await ASC.zip.getJustFiles();
            retValue.folders = await ASC.zip.getJustDirectories();
        } else {
            const directoryMap: Map<string, boolean> = new Map<string, boolean>();
            const allEntries: string[] = await ASC.zip.getAllEntries();
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

        await ASC.zip.close();
        return retValue;
    }

    /** This method removes staged files from our storage system (i.e. uploaded but not ingested). If successful,
     * it then deletes the asset version
     */
    static async discardAssetVersion(assetVersion: DBAPI.AssetVersion): Promise<AssetStorageResult> {
        // only works for staged versions -- fail if not staged
        if (assetVersion.Ingested || !assetVersion.StorageKeyStaging)
            return { asset: null, assetVersion, success: false, error: 'AssetStorageAdapter.discardAssetVersion: Ingested asset versions cannot be discarded' };

        // fetch storage interface
        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage)
            return { asset: null, assetVersion, success: false, error: 'AssetStorageAdapter.discardAssetVersion: Unable to retrieve Storage Implementation from StorageFactory.getInstace()' };

        // discard staged asset
        const DWSR: STORE.DiscardWriteStreamResult = await storage.discardWriteStream({ storageKey: assetVersion.StorageKeyStaging });
        if (!DWSR.success)
            return { asset: null, assetVersion, success: false, error: `AssetStorageAdapter.discardAssetVersion: ${DWSR.error}` };

        // delete assetVersion
        return (await assetVersion.delete())
            ? { asset: null, assetVersion: null, success: true, error: '' } /* istanbul ignore next */
            : { asset: null, assetVersion: null, success: false, error: 'AssetStorageAdapter.discardAssetVersion: DBAPI.AssetVersion.delete failed' };
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
            IsBagit: assetVersionOld.IsBagit,
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
}