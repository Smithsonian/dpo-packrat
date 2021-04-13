import * as path from 'path';
import * as STORE from '../interface';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import * as ST from '../impl/LocalStorage/SharedTypes';
import { ZipFile, ZipStream, IOResults, IZip } from '../../utils';
import { BagitReader, BAGIT_DATA_DIRECTORY, BulkIngestReader, IngestMetadata } from '../../utils/parser';
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

export type IngestAssetResult = {
    assets: DBAPI.Asset[] | null,
    assetVersions: DBAPI.AssetVersion[] | null,
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
    asset: DBAPI.Asset | null;
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
    const comRes: AssetStorageResultCommit = await AssetStorageAdapter.commitNewAsset({ storageKey,...}});    // commit uploads bits to staging storage
    // comRes.assets; comRes.assetVersions; <-- These have been created; when a bulk ingest file is uploaded, multiple assets and assetVersions may be created
 */
export class AssetStorageAdapter {
    static async readAsset(asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion): Promise<STORE.ReadStreamResult> {
        LOG.logger.info(`STR AssetStorageAdapter.readAsset idAsset ${asset.idAsset}, idAssetVersion ${assetVersion.idAssetVersion}`);
        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            const error: string = 'AssetStorageAdapter.readAsset: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            LOG.logger.error(error);
            return { readStream: null, fileName: null, storageHash: null, success: false, error };
        }

        const { storageKey, ingested, error } = AssetStorageAdapter.computeStorageKeyAndIngested(asset, assetVersion); ingested; /* istanbul ignore next */
        if (!storageKey) {
            LOG.logger.error(error);
            return { readStream: null, fileName: null, storageHash: null, success: false, error };
        }

        const readStreamInput: STORE.ReadStreamInput = {
            storageKey,
            fileName: asset.FileName,
            version: assetVersion.Version,
            staging: !assetVersion.Ingested
        };

        return await storage.readStream(readStreamInput);
    }

    static async readAssetVersion(assetVersion: DBAPI.AssetVersion): Promise<STORE.ReadStreamResult> {
        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset); /* istanbul ignore next */
        if (!asset) {
            const error: string = `AssetStorageAdapter.readAssetVersion: Unable to retrieve Asset ${assetVersion.idAsset}`;
            LOG.logger.error(error);
            return { readStream: null, fileName: null, storageHash: null, success: false, error };
        }

        return await AssetStorageAdapter.readAsset(asset, assetVersion);
    }

    static async readAssetVersionByID(idAssetVersion: number): Promise<STORE.ReadStreamResult> {
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion); /* istanbul ignore next */
        if (!assetVersion) {
            const error: string = `AssetStorageAdapter.readAssetVersionByID: Unable to retrieve Asset ${idAssetVersion}`;
            LOG.logger.error(error);
            return { readStream: null, fileName: null, storageHash: null, success: false, error };
        }

        return await AssetStorageAdapter.readAssetVersion(assetVersion);
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
        LOG.logger.info(`STR AssetStorageAdapter.commitNewAssetVersion idAsset ${asset.idAsset}: ${commitWriteStreamInput.storageKey}`);

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
            DateCreated, resStorage, commitWriteStreamInput.storageKey, false, null, null);
        /* istanbul ignore else */
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
        let loadResults: IOResults = await bagitZip.load(); /* istanbul ignore next */
        if (!loadResults.success) {
            LOG.logger.error(loadResults.error);
            return { assets: null, assetVersions: null, success: false, error: loadResults.error };
        }

        const bulkIngestReader: BulkIngestReader = new BulkIngestReader();
        loadResults = await bulkIngestReader.loadFromZip(bagitZip, true); /* istanbul ignore next */
        if (!loadResults.success) {
            LOG.logger.error(loadResults.error);
            return { assets: null, assetVersions: null, success: false, error: loadResults.error };
        }

        const assets: DBAPI.Asset[] = [];
        const assetVersions: DBAPI.AssetVersion[] = [];

        // process objects; for each, create an asset, asset version, and metadata attached to the assetversion; set asset FilePath to the path within the zip of interest
        let objectNumber: number = 1;
        for (const ingestedObject of bulkIngestReader.ingestedObjects) {
            const assetClone: DBAPI.Asset = new DBAPI.Asset({ ...asset });
            assetClone.FilePath = ingestedObject.directory || /* istanbul ignore next */ '';

            let eVocabID: eVocabularyID = eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry; /* istanbul ignore else */
            if (BulkIngestReader.ingestedObjectIsPhotogrammetry(ingestedObject))
                eVocabID = eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry;
            else if (BulkIngestReader.ingestedObjectIsModel(ingestedObject))
                eVocabID = eVocabularyID.eAssetAssetTypeModel;
            /* istanbul ignore next */
            if (!await assetClone.setAssetType(eVocabID))
                return { assets: null, assetVersions: null, success: false, error: 'AssetStorageAdapter.commitNewAssetVersionBulk unable to create assets & asset versions' };

            const assetNameOverride: string = asset.FileName + ' Set ' + objectNumber;
            objectNumber++;
            const assetVersion: DBAPI.AssetVersion | null = await AssetStorageAdapter.createAssetConstellation(assetClone, idUserCreator,
                DateCreated, resStorage, commitWriteStreamInput.storageKey, true, ingestedObject, assetNameOverride); /* istanbul ignore else */
            if (assetVersion) {
                assets.push(assetClone);
                assetVersions.push(assetVersion);
            } else
                return { assets: null, assetVersions: null, success: false, error: 'AssetStorageAdapter.commitNewAssetVersionBulk unable to create assets & asset versions' };
        }

        return { assets, assetVersions, success: true, error: '' };
    }

    /** creates asset (if asset.idAsset == 0) and creates an assetVersion */
    private static async createAssetConstellation(asset: DBAPI.Asset, idUserCreator: number,
        DateCreated: Date, resStorage: STORE.CommitWriteStreamResult, storageKey: string,
        BulkIngest: boolean, ingestedObject: IngestMetadata | null, assetNameOverride: string | null): Promise<DBAPI.AssetVersion | null> {
        // LOG.logger.info(`STR AssetStorageAdapter.createAssetConstellation for ${JSON.stringify(asset)} with override name ${assetNameOverride}`);
        if (asset.idAsset == 0) {
            if (assetNameOverride)
                asset.FileName = assetNameOverride;
            /* istanbul ignore if */
            if (!await asset.create()) {
                const error: string = `AssetStorageAdapter.createAssetAndVersion: Unable to create Asset ${JSON.stringify(asset, H.Helpers.stringifyCallbackCustom)}`;
                LOG.logger.error(error);
                return null;
            }
        }

        const assetVersion: DBAPI.AssetVersion = new DBAPI.AssetVersion({
            idAsset: asset.idAsset,
            Version: 1, /* ignored */
            FileName: assetNameOverride ? assetNameOverride : asset.FileName,
            idUserCreator,
            DateCreated,
            StorageHash: resStorage.storageHash ? resStorage.storageHash : /* istanbul ignore next */ '',
            StorageSize: resStorage.storageSize ? BigInt(resStorage.storageSize) : /* istanbul ignore next */ BigInt(0),
            StorageKeyStaging: storageKey,
            Ingested: false,
            BulkIngest,
            idAssetVersion: 0
        });

        /* istanbul ignore if */
        if (!await assetVersion.create()) {
            const error: string = `AssetStorageAdapter.commitNewAssetVersion: Unable to create AssetVersion ${JSON.stringify(assetVersion, H.Helpers.stringifyCallbackCustom)}`;
            LOG.logger.error(error);
            return null;
        } /* istanbul ignore next */

        if (!await AssetStorageAdapter.storeBulkIngestMetadata(assetVersion, idUserCreator, ingestedObject))
            return null;
        return assetVersion;
    }

    private static async storeBulkIngestMetadata(assetVersion: DBAPI.AssetVersion, idUserCreator: number, ingestedObject: IngestMetadata | null): Promise<boolean> {
        if (!ingestedObject)
            return true;

        const SO: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject(); /* istanbul ignore next */
        if (!SO) {
            const error: string = `AssetStorageAdapter.commitNewAssetVersion: Unable to fetch system object for AssetVersion ${JSON.stringify(assetVersion, H.Helpers.stringifyCallbackCustom)}`;
            LOG.logger.error(error);
            return false;
        }

        const vocabulary: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(eVocabularyID.eMetadataMetadataSourceBulkIngestion);
        const metadata: DBAPI.Metadata = new DBAPI.Metadata({
            Name: 'Bulk Ingestion',
            ValueShort: null,
            ValueExtended: JSON.stringify(ingestedObject, H.Helpers.stringifyCallbackCustom),
            idAssetValue: null,
            idUser: idUserCreator,
            idVMetadataSource: vocabulary ? vocabulary.idVocabulary : /* istanbul ignore next */ null,
            idSystemObject: SO.idSystemObject,
            idMetadata: 0
        }); /* istanbul ignore next */

        if (!await metadata.create()) {
            const error: string = `AssetStorageAdapter.commitNewAssetVersion: Unable to create metadata ${JSON.stringify(metadata, H.Helpers.stringifyCallbackCustom)} for AssetVersion ${JSON.stringify(assetVersion, H.Helpers.stringifyCallbackCustom)}`;
            LOG.logger.error(error);
            return false;
        }
        return true;
    }

    static async extractBulkIngestMetadata(assetVersion: DBAPI.AssetVersion): Promise<IngestMetadata | null> {
        LOG.logger.info(`STR AssetStorageAdapter.extractBulkIngestMetadata idAsset ${assetVersion.idAsset}, idAssetVersion ${assetVersion.idAssetVersion}`);
        const SO: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject();
        const metadataList: DBAPI.Metadata[] | null = SO ? await DBAPI.Metadata.fetchFromSystemObject(SO.idSystemObject) : /* istanbul ignore next */ null; /* istanbul ignore next */
        if (!metadataList)
            return null;

        const vocabulary: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(eVocabularyID.eMetadataMetadataSourceBulkIngestion); /* istanbul ignore next */
        if (!vocabulary)
            return null;

        for (const metadata of metadataList) { /* istanbul ignore next */
            if (metadata.idVMetadataSource != vocabulary.idVocabulary || !metadata.ValueExtended)
                continue;
            // Found it!
            try {
                return JSON.parse(metadata.ValueExtended);
            } catch (error) {
                LOG.logger.error(`AssetStorageAdapter.extractBulkIngestMetadata ${JSON.stringify(metadata, H.Helpers.stringifyCallbackCustom)}`, error);
                return null;
            }
        }
        return null;
    }

    static async ingestAsset(asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion,
        SOBased: DBAPI.SystemObjectBased, opInfo: STORE.OperationInfo): Promise<IngestAssetResult> {
        const SO: DBAPI.SystemObject | null = await SOBased.fetchSystemObject();
        /* istanbul ignore if */
        if (!SO) {
            const error: string = `Unable to fetch SystemObject for ${SO}`;
            LOG.logger.error(error);
            return { assets: null, assetVersions: null, success: false, error };
        }
        return await AssetStorageAdapter.ingestAssetForSystemObjectID(asset, assetVersion, SO.idSystemObject, opInfo);
    }

    static async ingestAssetForSystemObjectID(asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion,
        idSystemObject: number, opInfo: STORE.OperationInfo): Promise<IngestAssetResult> {
        LOG.logger.info(`STR AssetStorageAdapter.ingestAssetForSystemObjectID idAsset ${asset.idAsset}, idAssetVersion ${assetVersion.idAssetVersion}, idSystemObject ${idSystemObject}`);
        // Call IStorage.promote
        // Update asset.StorageKey, if needed
        // Update assetVersion.Ingested to true
        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            const error: string = 'AssetStorageAdapter.ingestAsset: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            LOG.logger.error(error);
            return { assets: null, assetVersions: null, success: false, error };
        }

        const metadata: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(idSystemObject, DBAPI.eObjectGraphMode.eAncestors); /* istanbul ignore next */
        if (!await metadata.fetch()) {
            const error: string = `AssetStorageAdapter.ingestAsset: Update to retrieve object ancestry for system object ${idSystemObject}`;
            LOG.logger.error(error);
            return { assets: null, assetVersions: null, success: false, error };
        }

        const isZipFilename: boolean = (path.extname(assetVersion.FileName).toLowerCase() === '.zip');
        const eAssetType: CACHE.eVocabularyID | undefined = await asset.assetType();
        const unzipAssets: boolean = isZipFilename &&
            (eAssetType == CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry ||
            eAssetType == CACHE.eVocabularyID.eAssetAssetTypeModel);
        if (assetVersion.BulkIngest || unzipAssets) {
            // Use bulkIngestReader to extract contents for assets in and below asset.FilePath
            const CAR: CrackAssetResult = await AssetStorageAdapter.crackAssetWorker(storage, asset, assetVersion); /* istanbul ignore next */
            if (!CAR.success || !CAR.zip)
                return { assets: null, assetVersions: null, success: false, error: CAR.error };
            const ISR: IngestAssetResult = await AssetStorageAdapter.ingestAssetBulkZipWorker(storage, asset, assetVersion, metadata, opInfo, CAR.zip, assetVersion.BulkIngest);
            await CAR.zip.close();
            return ISR;
        } else {
            const ASR: AssetStorageResult = await AssetStorageAdapter.promoteAssetWorker(storage, asset, assetVersion, metadata, opInfo, null);
            if (!ASR.success || !ASR.asset || !ASR.assetVersion)
                return { assets: null, assetVersions: null, success: false, error: ASR.error };
            else
                return { assets: [ASR.asset], assetVersions: [ASR.assetVersion], success: true, error: '' };
        }
    }

    private static async ingestAssetBulkZipWorker(storage: IStorage, asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion,
        metadata: DBAPI.ObjectGraph, opInfo: STORE.OperationInfo, zip: IZip, bulkIngest: boolean): Promise<IngestAssetResult> {
        const assets: DBAPI.Asset[] = [];
        const assetVersions: DBAPI.AssetVersion[] = [];
        // for bulk ingest, the folder from the zip from which to extract assets is specified in asset.FilePath
        const fileID = bulkIngest ? `/${BAGIT_DATA_DIRECTORY}${asset.FilePath}/` : '';
        for (const entry of await zip.getAllEntries(null)) {
            // LOG.logger.info(`Checking ${entry} for ${fileID}`);
            if (bulkIngest && !entry.includes(fileID)) // only process assets found in our path
                continue;

            // Get a readstream to that part of the zip; compute hash and filesize
            let inputStream: NodeJS.ReadableStream | null = await zip.streamContent(entry); /* istanbul ignore next */
            if (!inputStream) {
                const error: string = `AssetStorageAdapter.ingestAssetBulkZipWorker unable to stream entry ${entry} of AssetVersion ${JSON.stringify(assetVersion, H.Helpers.stringifyCallbackCustom)}`;
                LOG.logger.error(error);
                return { assets, assetVersions, success: false, error };
            }
            const hashResults: H.HashResults = await H.Helpers.computeHashFromStream(inputStream, ST.OCFLDigestAlgorithm); /* istanbul ignore next */
            if (!hashResults.success) {
                LOG.logger.error(hashResults.error);
                return { assets, assetVersions, success: false, error: hashResults.error };
            }

            // Get a second readstream to that part of the zip, to reset stream position after computing the hash
            inputStream = await zip.streamContent(entry); /* istanbul ignore next */
            if (!inputStream) {
                const error: string = `AssetStorageAdapter.ingestAssetBulkZipWorker unable to stream entry ${entry} of AssetVersion ${JSON.stringify(assetVersion, H.Helpers.stringifyCallbackCustom)}`;
                LOG.logger.error(error);
                return { assets, assetVersions, success: false, error };
            }

            // Determine asset type
            let eAssetType: eVocabularyID;
            switch (await VocabularyCache.vocabularyIdToEnum(asset.idVAssetType)) {
                case eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry: eAssetType = eVocabularyID.eAssetAssetTypeCaptureDataFile; break;
                case eVocabularyID.eAssetAssetTypeModel:
                    if (await CACHE.VocabularyCache.mapModelFileByExtension(asset.FileName) !== undefined)
                        eAssetType = eVocabularyID.eAssetAssetTypeModelGeometryFile;
                    else {
                        let psuedoVariantType: string = path.extname(asset.FileName);
                        if (psuedoVariantType)
                            psuedoVariantType = psuedoVariantType.substring(1); // strip off leading '.' in extension
                        if (await CACHE.VocabularyCache.mapPhotogrammetryVariantType(psuedoVariantType) !== undefined)
                            eAssetType = eVocabularyID.eAssetAssetTypeModelUVMapFile;
                        else
                            eAssetType = eVocabularyID.eAssetAssetTypeOther;
                    }
                    break; /* istanbul ignore next */
                default:
                    LOG.logger.info(`AssetStorageAdapter.ingestAssetBulkZipWorker encountered unxpected asset type id for Asset ${JSON.stringify(asset, H.Helpers.stringifyCallbackCustom)}`);
                    eAssetType = eVocabularyID.eAssetAssetTypeOther;
                    break;
            }
            const idVAssetType: number | undefined = await VocabularyCache.vocabularyEnumToId(eAssetType); /* istanbul ignore next */
            if (!idVAssetType) {
                const error: string = `AssetStorageAdapter.ingestAssetBulkZipWorker unable to compute asset type of Asset ${JSON.stringify(asset, H.Helpers.stringifyCallbackCustom)}`;
                LOG.logger.error(error);
                return { assets, assetVersions, success: false, error };
            }

            // create asset and asset version
            const FileName: string = path.basename(entry);
            let FilePath: string = path.dirname(entry);
            if (FilePath === '.')
                FilePath = '';
            const assetComponent: DBAPI.Asset = new DBAPI.Asset({ FileName, FilePath, idAssetGroup: 0, idVAssetType, idSystemObject: asset.idSystemObject, StorageKey: null, idAsset: 0 });
            const CWSR: STORE.CommitWriteStreamResult = { storageHash: hashResults.hash, storageSize: hashResults.dataLength, success: true, error: '' };
            const assetVersionComponent: DBAPI.AssetVersion | null =
                await AssetStorageAdapter.createAssetConstellation(assetComponent, assetVersion.idUserCreator, assetVersion.DateCreated, CWSR, '', false, null, null); /* istanbul ignore next */
            if (!assetVersionComponent) {
                const error: string = `AssetStorageAdapter.ingestAssetBulkZipWorker unable to create AssetVersion from Asset ${JSON.stringify(asset, H.Helpers.stringifyCallbackCustom)}`;
                LOG.logger.error(error);
                return { assets, assetVersions, success: false, error };
            }

            // Create a storage key, Promote the asset, Update the asset
            const ASR: AssetStorageResult = await AssetStorageAdapter.promoteAssetWorker(storage, assetComponent, assetVersionComponent, metadata, opInfo, inputStream); /* istanbul ignore next */
            if (!ASR.success) {
                const error: string = `AssetStorageAdapter.ingestAssetBulkZipWorker unable to promote Asset ${JSON.stringify(asset, H.Helpers.stringifyCallbackCustom)}: ${ASR.error}`;
                LOG.logger.error(error);
                return { assets, assetVersions, success: false, error };
            }

            assets.push(assetComponent);
            assetVersions.push(assetVersionComponent);
        }

        // If no other assets exist for this bulk ingest, retire the asset version and remove the staged file
        const relatedAV: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchByStorageKeyStaging(assetVersion.StorageKeyStaging);
        if (relatedAV && relatedAV.length == 1) {
            const ASR: AssetStorageResult = await AssetStorageAdapter.discardAssetVersion(assetVersion); /* istanbul ignore next */
            if (!ASR.success) {
                const error: string = `AssetStorageAdapter.ingestAssetBulkZipWorker: ${ASR.error}`;
                LOG.logger.error(error);
                return { assets, assetVersions, success: false, error };
            }
        } else /* istanbul ignore next */ if (!await DBAPI.SystemObject.retireSystemObject(assetVersion)) {  // otherwise just retire the asset version
            const error: string = `AssetStorageAdapter.ingestAssetBulkZipWorker unable to retire AssetVersion ${JSON.stringify(assetVersion, H.Helpers.stringifyCallbackCustom)}`;
            LOG.logger.error(error);
            return { assets, assetVersions, success: false, error };
        }

        // clear StorageKeyStaging and updated Ingested flag from this retired asset version
        assetVersion.StorageKeyStaging = '';
        assetVersion.Ingested = true;
        if (!await assetVersion.update()) /* istanbul ignore next */ {
            const error: string = `AssetStorageAdapter.ingestAssetBulkZipWorker unable to clear staging storage key from AssetVersion ${JSON.stringify(assetVersion, H.Helpers.stringifyCallbackCustom)}`;
            LOG.logger.error(error);
            return { assets, assetVersions, success: false, error };
        }

        // Retire the asset that represented this piece of the bulk ingest
        /* istanbul ignore next */
        if (!await DBAPI.SystemObject.retireSystemObject(asset)) {
            const error: string = `AssetStorageAdapter.ingestAssetBulkZipWorker unable to retire Asset ${JSON.stringify(asset, H.Helpers.stringifyCallbackCustom)}`;
            LOG.logger.error(error);
            return { assets, assetVersions, success: false, error };
        }

        return { assets, assetVersions, success: true, error: '' };
    }

    private static async promoteAssetWorker(storage: IStorage, asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion,
        metadata: DBAPI.ObjectGraph, opInfo: STORE.OperationInfo, inputStream: NodeJS.ReadableStream | null): Promise<AssetStorageResult> {

        let storageKey: string = (asset.idAsset > 0 && asset.StorageKey) ? asset.StorageKey : '';
        if (!storageKey) {
            const storageKeyResults = await storage.computeStorageKey(asset.idAsset.toString()); /* istanbul ignore next */
            if (!storageKeyResults.success) {
                LOG.logger.error(storageKeyResults.error);
                return { asset, assetVersion, success: false, error: storageKeyResults.error };
            } else
                storageKey = storageKeyResults.storageKey;
        }

        const promoteStagedAssetInput: STORE.PromoteStagedAssetInput = {
            storageKeyStaged: assetVersion.StorageKeyStaging,
            storageKeyFinal: storageKey,
            fileName: asset.FileName,
            inputStream,
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
        if (asset.idSystemObject != metadata.idSystemObject) {
            asset.idSystemObject = metadata.idSystemObject;
            updateAsset = true;
        }
        if (asset.StorageKey != storageKey) {
            asset.StorageKey = storageKey;
            updateAsset = true;
        }
        if (updateAsset) /* istanbul ignore next */ {
            if (!await asset.update()) {
                const error: string = `AssetStorageAdapter.ingestAsset: Unable to update Asset ${JSON.stringify(asset, H.Helpers.stringifyCallbackCustom)}`;
                LOG.logger.error(error);
                return { asset, assetVersion, success: false, error };
            }
        }

        assetVersion.Ingested = true;
        assetVersion.StorageKeyStaging = ''; /* istanbul ignore next */
        if (!await assetVersion.update()) {
            const error: string = `AssetStorageAdapter.ingestAsset: Unable to update AssetVersion ${JSON.stringify(assetVersion, H.Helpers.stringifyCallbackCustom)}`;
            LOG.logger.error(error);
            return { asset, assetVersion, success: false, error };
        }

        return { asset, assetVersion, success: true, error: '' };
    }

    static async renameAsset(asset: DBAPI.Asset, fileNameNew: string, opInfo: STORE.OperationInfo): Promise<AssetStorageResult> {
        LOG.logger.info(`STR AssetStorageAdapter.renameAsset idAsset ${asset.idAsset}: ${asset.FileName} -> ${fileNameNew}`);
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
                    error: `AssetStorageAdapter.renameAsset: Unable to update Asset.FileName ${JSON.stringify(asset, H.Helpers.stringifyCallbackCustom)}`,
                    asset,
                    assetVersion: null
                };
        }
        return ASR;
    }

    static async hideAsset(asset: DBAPI.Asset, opInfo: STORE.OperationInfo): Promise<AssetStorageResult> {
        LOG.logger.info(`STR AssetStorageAdapter.hideAsset idAsset ${asset.idAsset}`);
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
            /* istanbul ignore next */
            if (!await DBAPI.SystemObject.retireSystemObject(asset)) /* istanbul ignore next */
                return {
                    success: false,
                    error: `AssetStorageAdapter.hideAsset: Unable to mark SystemObject as retired for Asset ${JSON.stringify(asset, H.Helpers.stringifyCallbackCustom)}`,
                    asset,
                    assetVersion: null
                };
        }
        return ASR;
    }

    static async reinstateAsset(asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion | null, opInfo: STORE.OperationInfo): Promise<AssetStorageResult> {
        LOG.logger.info(`STR AssetStorageAdapter.reinstateAsset idAsset ${asset.idAsset}, idAssetVersion ${assetVersion?.idAssetVersion}`);
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
            /* istanbul ignore next */
            if (!await DBAPI.SystemObject.reinstateSystemObject(asset)) /* istanbul ignore next */
                return {
                    success: false,
                    error: `AssetStorageAdapter.reinstateAsset: Unable to mark SystemObject as not retired for Asset ${JSON.stringify(asset, H.Helpers.stringifyCallbackCustom)}`,
                    asset,
                    assetVersion
                };
        }

        return ASR;
    }

    /** Cracks open the file associated with assetVersion in an efficient manner.
     * Caller must call 'await CrackAssetResult.zip.close()' if the returned zip is not null. */
    static async crackAsset(assetVersion: DBAPI.AssetVersion): Promise<CrackAssetResult> {
        // 1. retrieve the associated asset
        // 2. determine if this is a plain old zip or a bagit bulk ingestion file (determined from asset.idVAssetType)
        // 3. determine the storage key and whether it's staging or repository
        // 4a. for repository, construct either a ZipStream (plain old zip) or a BagitReader (based on a zip stream)
        // 4b. for staging, construct either a ZipFile (plain old zip) or a BagitReader (based on a zip file)
        // 5. use the constructed object to compute contents
        // 6. close the object

        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset); /* istanbul ignore next */
        if (!asset) {
            const error: string = `AssetStorageAdapter.crackAsset unable to compute asset for AssetVersion ${JSON.stringify(assetVersion, H.Helpers.stringifyCallbackCustom)}`;
            LOG.logger.error(error);
            return { success: false, error, zip: null, asset: null, isBagit: false };
        }

        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            const error: string = 'AssetStorageAdapter.crackAsset: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            LOG.logger.error(error);
            return { success: false, error, zip: null, asset: null, isBagit: false };
        }

        return await AssetStorageAdapter.crackAssetWorker(storage, asset, assetVersion);
    }

    private static async crackAssetWorker(storage: IStorage, asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion): Promise<CrackAssetResult> {
        const { storageKey, ingested, error } = AssetStorageAdapter.computeStorageKeyAndIngested(asset, assetVersion); /* istanbul ignore next */
        if (!storageKey) {
            LOG.logger.error(error);
            return { success: false, error, zip: null, asset: null, isBagit: false };
        }

        const isZipFilename: boolean = (path.extname(assetVersion.FileName).toLowerCase() === '.zip');
        const isBulkIngest: boolean = assetVersion.BulkIngest || (await asset.assetType() == eVocabularyID.eAssetAssetTypeBulkIngestion);
        LOG.logger.info(`STR crackAssetWorker fileName ${assetVersion.FileName} storageKey ${storageKey} ingested ${ingested} isBulkIngest ${isBulkIngest} isZipFile ${isZipFilename}`);
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
                return { success: false, error: RSR.error, zip: null, asset: null, isBagit: false };
            }

            reader = (isBulkIngest) /* istanbul ignore next */ // We don't ingest bulk ingest files as is -- they end up getting cracked apart, so we're unlikely to hit this branch of code
                ? new BagitReader({ zipFileName: null, zipStream: RSR.readStream, directory: null, validate: true, validateContent: false })
                : new ZipStream(RSR.readStream, isZipFilename); // use isZipFilename to determine if errors should be logged
        } else {
            // non-ingested content is staged locally
            const stagingFileName: string = await storage.stagingFileName(storageKey);
            reader = (isBulkIngest)
                ? new BagitReader({ zipFileName: stagingFileName, zipStream: null, directory: null, validate: true, validateContent: false })
                : new ZipFile(stagingFileName, isZipFilename); // use isZipFilename to determine if errors should be logged
        }

        try {
            const ioResults: IOResults = await reader.load(); /* istanbul ignore next */
            if (!ioResults.success) {
                await reader.close();
                if (isBulkIngest || isZipFilename)
                    LOG.logger.error(ioResults.error);
                return { success: false, error: ioResults.error, zip: null, asset: null, isBagit: false };
            }
        } catch (error) /* istanbul ignore next */ {
            await reader.close();
            LOG.logger.error('AssetStorageAdapter.crackAsset', error);
            return { success: false, error: `AssetStorageAdapter.crackAsset ${JSON.stringify(error, H.Helpers.stringifyCallbackCustom)}`, zip: null, asset: null, isBagit: false };
        }
        return { success: true, error: '', zip: reader, asset, isBagit: isBulkIngest };
    }

    static async getAssetVersionContents(assetVersion: DBAPI.AssetVersion): Promise<AssetVersionContent> {
        const retValue = {
            idAssetVersion: assetVersion.idAssetVersion,
            folders: new Array<string>(),
            all: new Array<string>()
        };

        const ASC: CrackAssetResult = await AssetStorageAdapter.crackAsset(assetVersion); /* istanbul ignore next */
        LOG.logger.info(`STR AssetStorageAdapter.getAssetVersionContents idAsset ${assetVersion.idAsset}, idAssetVersion ${assetVersion.idAssetVersion}, ASC.success ${ASC.success}, ASC.zip ${ASC.zip}`);
        if (!ASC.zip) {     // if our file is not a zip, just return it
            retValue.all.push(assetVersion.FileName);
            return retValue;
        }
        if (!ASC.success)   // if cracking the asset fails, then we found nothing
            return retValue;

        // for the time being, we handle bagit content differently than zip content
        // bagits (isBulkIngest) use getJustFiles() to report the contents of the data folder,
        //    and getJustDirectories() to report the directories in the data folder.
        //    Both are filtered using assetVersion.FilePath when BulkIngest is non-empty
        // zips give us everything
        if (ASC.isBagit) {
            const filter: string | null = (assetVersion.BulkIngest && ASC.asset) ? ASC.asset.FilePath : /* istanbul ignore next */ null;
            retValue.all = await ASC.zip.getJustFiles(filter);
            retValue.folders = await ASC.zip.getJustDirectories(filter);
        } else {
            const directoryMap: Map<string, boolean> = new Map<string, boolean>();
            const allEntries: string[] = await ASC.zip.getAllEntries(null);
            for (const entry of allEntries) {
                if (entry.endsWith('/'))
                    continue;
                const dirName: string = path.dirname(entry);
                if (!directoryMap.has(dirName) && dirName !== '.') {
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
     * it then retires the asset version
     */
    static async discardAssetVersion(assetVersion: DBAPI.AssetVersion): Promise<AssetStorageResult> {
        LOG.logger.info(`STR AssetStorageAdapter.discardAssetVersion idAsset ${assetVersion.idAsset}, idAssetVersion ${assetVersion.idAssetVersion}`);
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

        // retire assetVersion
        return (await DBAPI.SystemObject.retireSystemObject(assetVersion))
            ? { asset: null, assetVersion: null, success: true, error: '' } /* istanbul ignore next */
            : { asset: null, assetVersion: null, success: false, error: 'AssetStorageAdapter.discardAssetVersion: DBAPI.AssetVersion.delete failed' };
    }

    private static async actOnAssetWorker(asset: DBAPI.Asset, opInfo: STORE.OperationInfo,
        renameAssetInput: STORE.RenameAssetInput | null,
        hideAssetInput: STORE.HideAssetInput | null,
        reinstateAssetInput: STORE.ReinstateAssetInput | null): Promise<AssetStorageResult> {

        /* istanbul ignore next */
        if (!asset.StorageKey) {
            const error: string = `AssetStorageAdapter.actOnAssetWorker: Asset ${JSON.stringify(asset, H.Helpers.stringifyCallbackCustom)} has null storageKey`;
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
            BulkIngest: assetVersionOld.BulkIngest,
            idAssetVersion: 0
        });

        /* istanbul ignore next */
        if (!await assetVersion.create()) {
            retValue.success = false;
            retValue.error = `AssetStorageAdapter.actOnAssetWorker: Unable to create AssetVersion ${JSON.stringify(assetVersion, H.Helpers.stringifyCallbackCustom)}`;
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
                error = `AssetStorageAdapter.computeStorageKeyAndIngested: Asset ${JSON.stringify(asset, H.Helpers.stringifyCallbackCustom)} has null storageKey`;
                LOG.logger.error(error);
                return { storageKey, ingested, error };
            }
            storageKey = asset.StorageKey;
        } else
            storageKey = assetVersion.StorageKeyStaging;
        return { storageKey, ingested, error };
    }
}