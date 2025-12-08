import * as STORE from '../interface';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as META from '../../metadata';
import * as WF from '../../workflow/interface';
import * as REP from '../../report/interface';
import * as H from '../../utils/helpers';
import * as ST from '../impl/LocalStorage/SharedTypes';
import { ZipFile, ZipStream, IOResults, IZip } from '../../utils';
import { BagitReader, BAGIT_DATA_DIRECTORY, BulkIngestReader, IngestMetadata } from '../../utils/parser';
import { StorageFactory } from './StorageFactory';
import { IStorage } from './IStorage';
import { AssetVersionContent } from '../../types/graphql';
import { VocabularyCache } from '../../cache';
import { ASL, LocalStore } from '../../utils/localStore';
import { SvxReader } from '../../utils/parser';
import { RouteBuilder, eHrefMode } from '../../http/routes/routeBuilder';
import * as COMMON from '@dpo-packrat/common';
import { RecordKeeper as RK } from '../../records/recordKeeper';

import * as path from 'path';
import * as fs from 'fs-extra';
import * as mime from 'mime-types';

export type AssetStorageResult = {
    asset: DBAPI.Asset | null;
    assetVersion: DBAPI.AssetVersion | null;
    success: boolean;
    error?: string;
};

export type IngestAssetInput = {
    asset: DBAPI.Asset,
    assetVersion: DBAPI.AssetVersion,
    allowZipCracking: boolean;
    SOBased: DBAPI.SystemObjectBased | null;    // supply either SOBased or idSystemObject
    idSystemObject: number | null;              // supply either SOBased or idSystemObject
    opInfo: STORE.OperationInfo;
    Comment: string | null;                     // Optional comment used to create new system object version
    doNotSendIngestionEvent?: boolean | undefined;
    doNotUpdateParentVersion?: boolean | undefined;
};

export type IngestAssetResult = {
    success: boolean;
    error?: string;
    assets?: DBAPI.Asset[] | null | undefined;
    assetVersions?: DBAPI.AssetVersion[] | null | undefined;
    systemObjectVersion?: DBAPI.SystemObjectVersion | null | undefined;
    assetsUnzipped?: boolean | undefined;
    assetsIngested?: boolean | undefined;
    affectedSystemObjectIds?: Set<number> | null | undefined;
};

export type AssetStorageResultCommit = {
    assets: DBAPI.Asset[] | null;
    assetVersions: DBAPI.AssetVersion[] | null;
    success: boolean;
    error?: string;
};

export type AssetStorageCommitNewAssetInput = {
    storageKey: string;
    storageHash: string | null;
    FileName: string;
    FilePath: string;
    idAssetGroup: number | null;
    idVAssetType: number;
    idSOAttachment?: number | null;
    opInfo: STORE.OperationInfo;
    DateCreated: Date;
};

export type AssetStorageCommitNewAssetVersionInput = {
    storageKey: string;
    storageHash: string | null;
    asset: DBAPI.Asset;
    FilePath: string;
    idSOAttachment?: number | null;
    assetNameOverride: string | null;
    opInfo: STORE.OperationInfo;
    DateCreated: Date;
};

export type CrackAssetResult = {
    success: boolean;
    error?: string;
    zip: IZip | null;
    asset: DBAPI.Asset | null;
    isBagit: boolean;
};

export type IngestStreamOrFileInput = {
    readStream: NodeJS.ReadableStream | null;
    localFilePath: string | null;
    asset: DBAPI.Asset | null;
    FileName: string;
    FilePath: string;
    idAssetGroup: number;
    idVAssetType: number;
    allowZipCracking: boolean;
    idUserCreator: number;
    SOBased: DBAPI.SystemObjectBased;
    Comment: string | null;
    doNotSendIngestionEvent?: boolean | undefined;
    doNotUpdateParentVersion?: boolean | undefined;
};

type AssetFileOrStreamResult = {
    success: boolean;
    fileName?: string;
    stream?: NodeJS.ReadableStream;
    error?: string;
};

/**
    The AssetStorageAdapter provides a DBAPI-based bridge to the storage interface,
    enabling the storage system to know nothing about the DB.

    Usage synopsis (don't forget error handling, logging, null checking, etc.!)
    *******************************************************
    (1) Uploading a file to staging storage for a new asset
    *******************************************************
    const storage: IStorage | null = await StorageFactory.getInstance();                                // get storage interface
    const wsRes: WriteStreamResult = await storage.writeStream(FileName);                               // get write stream from storage interface
    const { writeStream, storageKey } = wsRes;
    // write bits to writeStream; save storageKey
    const comRes: AssetStorageResultCommit = await AssetStorageAdapter.commitNewAsset({ storageKey,...}});    // commit uploads bits to staging storage
    // comRes.assets; comRes.assetVersions; <-- These have been created; when a zip file or bulk ingest file is uploaded, multiple assets and assetVersions may be created
 */
export class AssetStorageAdapter {
    static async readAsset(asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion): Promise<STORE.ReadStreamResult> {

        const context = { fileName: asset.FileName, storageKey: asset.StorageKey, stagingKey: assetVersion.StorageKeyStaging,idAsset: asset.idAsset, idAssetSO: asset.idSystemObject, idAssetVersion: assetVersion.idAssetVersion };

        // LOG.info(`AssetStorageAdapter.readAsset idAsset ${asset.idAsset}, idAssetVersion ${assetVersion.idAssetVersion}`, LOG.LS.eSTR);
        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            const error: string = 'unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            RK.logError(RK.LogSection.eSTR,'read asset failed',error,{ ...context },'AssetStorageAdapter');
            return { readStream: null, fileName: null, storageHash: null, success: false, error };
        }

        const { storageKey, error } = AssetStorageAdapter.computeStorageKeyAndIngested(asset, assetVersion); /* istanbul ignore next */
        if (!storageKey) {
            RK.logError(RK.LogSection.eSTR,'read asset failed',H.Helpers.getErrorString(error),{ ...context },'AssetStorageAdapter');
            return { readStream: null, fileName: null, storageHash: null, success: false, error };
        }

        const readStreamInput: STORE.ReadStreamInput = {
            storageKey,
            fileName: assetVersion.FileName,
            version: assetVersion.Version,
            staging: !assetVersion.Ingested
        };

        const result: STORE.ReadStreamResult = await storage.readStream(readStreamInput);
        if(result.success===true)
            RK.logInfo(RK.LogSection.eSTR,'read asset success',undefined,{ ...context },'AssetStorageAdapter');
        else
            RK.logError(RK.LogSection.eSTR,'read asset failed',result.error,{ ...context },'AssetStorageAdapter');
        return result;
    }

    static async readAssetVersion(assetVersion: DBAPI.AssetVersion): Promise<STORE.ReadStreamResult> {
        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset); /* istanbul ignore next */
        if (!asset) {
            const error: string = `readAssetVersion: unable to retrieve Asset ${assetVersion.idAsset}`;
            RK.logError(RK.LogSection.eSTR,'read asset version failed','unable to retrieve asset',{ fileName: assetVersion.FileName, idAssetVersion: assetVersion.idAssetVersion },'AssetStorageAdapter');
            return { readStream: null, fileName: null, storageHash: null, success: false, error };
        }

        return await AssetStorageAdapter.readAsset(asset, assetVersion);
    }

    static async readAssetVersionByID(idAssetVersion: number): Promise<STORE.ReadStreamResult> {
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion); /* istanbul ignore next */
        if (!assetVersion) {
            const error: string = `readAssetVersionByID: Unable to retrieve Asset ${idAssetVersion}`;
            RK.logError(RK.LogSection.eSTR,'read asset version failed','unable to retrieve asset',{ idAssetVersion },'AssetStorageAdapter');
            return { readStream: null, fileName: null, storageHash: null, success: false, error };
        }

        return await AssetStorageAdapter.readAssetVersion(assetVersion);
    }

    /**
     * Commits Storage WriteStream
     * Creates and persists Asset and AssetVersion
     */
    static async commitNewAsset(commitNewAssetInput: AssetStorageCommitNewAssetInput): Promise<AssetStorageResultCommit> {
        const { storageKey, storageHash, FileName, FilePath, idAssetGroup, idVAssetType, idSOAttachment, opInfo, DateCreated } = commitNewAssetInput;
        const asset: DBAPI.Asset = new DBAPI.Asset({
            FileName,
            idAssetGroup,
            idVAssetType,
            idSystemObject: null,
            StorageKey: null,
            idAsset: 0
        });

        return await AssetStorageAdapter.commitNewAssetVersion({ storageKey, storageHash, asset, assetNameOverride: null, FilePath, idSOAttachment, opInfo, DateCreated });
    }

    /**
     * Commits Storage WriteStream
     * Creates and persists AssetVersion (and Asset if Asset.idAsset is 0)
     */
    static async commitNewAssetVersion(commitNewAssetVersionInput: AssetStorageCommitNewAssetVersionInput): Promise<AssetStorageResultCommit> {
        const { storageKey, storageHash, asset, assetNameOverride, FilePath, idSOAttachment, opInfo, DateCreated } = commitNewAssetVersionInput;
        const commitWriteStreamInput: STORE.CommitWriteStreamInput = { storageKey, storageHash };

        const context = { fileName: asset.FileName, storageKey, idAsset: asset.idAsset, idAssetSO: asset.idSystemObject, assetNameOverride };
        RK.logInfo(RK.LogSection.eSTR,'commit asset version',undefined,{ ...context },'AssetStorageAdapter');

        // get our storage system
        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            const error: string = 'unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            RK.logError(RK.LogSection.eSTR,'commit asset version failed',error,{ ...context },'AssetStorageAdapter');
            return { assets: null, assetVersions: null, success: false, error };
        }

        const resStorage: STORE.CommitWriteStreamResult = await storage.commitWriteStream(commitWriteStreamInput);
        if (!resStorage.success) {
            RK.logError(RK.LogSection.eSTR,'commit asset version failed',`cannot commit write stream: ${resStorage.error}`,{ ...context },'AssetStorageAdapter');
            return { assets: null, assetVersions: null, success: false, error: resStorage.error };
        }

        // detect & handle bulk ingest
        const isBulkIngest: boolean = (await asset.assetType() == COMMON.eVocabularyID.eAssetAssetTypeBulkIngestion);
        return (isBulkIngest)
            ? await AssetStorageAdapter.commitNewAssetVersionBulk(commitWriteStreamInput, asset, FilePath, idSOAttachment, opInfo, DateCreated, resStorage, storage)
            : await AssetStorageAdapter.commitNewAssetVersionNonBulk(commitWriteStreamInput, asset, FilePath, idSOAttachment, opInfo, DateCreated, assetNameOverride, resStorage);
    }

    private static async commitNewAssetVersionNonBulk(commitWriteStreamInput: STORE.CommitWriteStreamInput,
        asset: DBAPI.Asset, FilePath: string, idSOAttachment: number | null | undefined, opInfo: STORE.OperationInfo,
        DateCreated: Date, assetNameOverride: string | null, resStorage: STORE.CommitWriteStreamResult):
        Promise<AssetStorageResultCommit> {

        // set model and scene package Ingested to null, which means uploaded but not yet processed; WorkflowUpload will set this to false once validation is complete
        let Ingested: boolean | null = false;
        switch (await VocabularyCache.vocabularyIdToEnum(asset.idVAssetType)) {
            case COMMON.eVocabularyID.eAssetAssetTypeModel:
            case COMMON.eVocabularyID.eAssetAssetTypeScene:
                Ingested = null;
                break;
        }

        const assetVersion: DBAPI.AssetVersion | null = await AssetStorageAdapter.createAssetConstellation(asset, FilePath, opInfo,
            DateCreated, resStorage, commitWriteStreamInput.storageKey, false, idSOAttachment, null, assetNameOverride, Ingested);
        /* istanbul ignore else */
        if (assetVersion)
            return { assets: [ asset ], assetVersions: [ assetVersion ], success: true };
        else
            return { assets: null, assetVersions: null, success: false, error: 'AssetStorageAdapter.commitNewAssetVersionNonBulk unable to create assets & asset versions' };
    }

    // split bulk ingest into separate assets and asset versions, one per system object in the bulk ingest
    private static async commitNewAssetVersionBulk(commitWriteStreamInput: STORE.CommitWriteStreamInput,
        asset: DBAPI.Asset, FilePath: string, idSOAttachment: number | null | undefined, opInfo: STORE.OperationInfo,
        DateCreated: Date, resStorage: STORE.CommitWriteStreamResult, storage: IStorage): Promise<AssetStorageResultCommit> {

        const context = { fileName: asset.FileName, idAsset: asset.idAsset, idAssetSO: asset.idSystemObject, idSOAttachment };

        // Compute path to bagit zip; crack it open; pass it off to bulkIngestReader
        const stagingFileName: string = await storage.stagingFileName(commitWriteStreamInput.storageKey);
        const bagitZip: IZip = new BagitReader({ zipFileName: stagingFileName, zipStream: null, directory: null, validate: true, validateContent: false });
        let loadResults: IOResults = await bagitZip.load(); /* istanbul ignore next */
        if (!loadResults.success) {
            RK.logError(RK.LogSection.eSTR,'commit asset version failed',`cannot build Bagit Reader: ${loadResults.error}`,{ ...context, stagingFileName },'AssetStorageAdapter');
            return { assets: null, assetVersions: null, success: false, error: loadResults.error };
        }

        const bulkIngestReader: BulkIngestReader = new BulkIngestReader();
        loadResults = await bulkIngestReader.loadFromZip(bagitZip, true); /* istanbul ignore next */
        if (!loadResults.success) {
            RK.logError(RK.LogSection.eSTR,'commit asset version failed',`cannot load from ZIP: ${loadResults.error}`,{ ...context, stagingFileName },'AssetStorageAdapter');
            return { assets: null, assetVersions: null, success: false, error: loadResults.error };
        }

        const assets: DBAPI.Asset[] = [];
        const assetVersions: DBAPI.AssetVersion[] = [];

        // process objects; for each, create an asset, asset version, and metadata attached to the assetversion; set asset FilePath to the path within the zip of interest
        let objectNumber: number = 1;
        for (const ingestedObject of bulkIngestReader.ingestedObjects) {
            const assetClone: DBAPI.Asset = new DBAPI.Asset({ ...asset });

            let ingested: boolean | null = false;
            let eVocabID: COMMON.eVocabularyID = COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry; /* istanbul ignore else */
            if (BulkIngestReader.ingestedObjectIsPhotogrammetry(ingestedObject))
                eVocabID = COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry;
            else if (BulkIngestReader.ingestedObjectIsModel(ingestedObject)) {
                eVocabID = COMMON.eVocabularyID.eAssetAssetTypeModel;
                ingested = null;
            } else if (BulkIngestReader.ingestedObjectIsScene(ingestedObject))
                eVocabID = COMMON.eVocabularyID.eAssetAssetTypeScene;

            /* istanbul ignore next */
            if (!await assetClone.setAssetType(eVocabID))
                return { assets: null, assetVersions: null, success: false, error: 'AssetStorageAdapter.commitNewAssetVersionBulk unable to create assets & asset versions' };

            const assetNameOverride: string = `Part ${objectNumber} of bulk ${asset.FileName}`;
            objectNumber++;
            const assetVersion: DBAPI.AssetVersion | null = await AssetStorageAdapter.createAssetConstellation(assetClone,
                ingestedObject.directory || /* istanbul ignore next */ FilePath,
                opInfo, DateCreated, resStorage, commitWriteStreamInput.storageKey, true, idSOAttachment,
                ingestedObject, assetNameOverride, ingested); /* istanbul ignore else */
            if (assetVersion) {
                assets.push(assetClone);
                assetVersions.push(assetVersion);
            } else {
                RK.logError(RK.LogSection.eSTR,'commit asset version failed','unable to crerate assets and asset versions',{ ...context, stagingFileName },'AssetStorageAdapter');
                return { assets: null, assetVersions: null, success: false, error: 'AssetStorageAdapter.commitNewAssetVersionBulk unable to create assets & asset versions' };
            }
        }

        return { assets, assetVersions, success: true };
    }

    /** creates asset (if asset.idAsset == 0) and creates an assetVersion */
    private static async createAssetConstellation(asset: DBAPI.Asset, FilePath: string, opInfo: STORE.OperationInfo,
        DateCreated: Date, resStorage: STORE.CommitWriteStreamResult, storageKey: string,
        BulkIngest: boolean, idSOAttachment: number | null | undefined, ingestedObject: IngestMetadata | null,
        assetNameOverride: string | null, Ingested: boolean | null): Promise<DBAPI.AssetVersion | null> {

        const context = { fileName: asset.FileName, idAsset: asset.idAsset, idAssetSO: asset.idSystemObject, idSOAttachment };

        // LOG.info(`AssetStorageAdapter.createAssetConstellation for ${JSON.stringify(asset)} with override name ${assetNameOverride}`, LOG.LS.eSTR);
        if (asset.idAsset == 0) {
            if (assetNameOverride)
                asset.FileName = assetNameOverride;
            /* istanbul ignore if */
            if (!await asset.create()) {
                RK.logError(RK.LogSection.eSTR,'create asset constellation failed','cannot create asset',{ ...context },'AssetStorageAdapter');
                return null;
            }
        }

        const assetVersion: DBAPI.AssetVersion = new DBAPI.AssetVersion({
            idAsset: asset.idAsset,
            Version: 0, /* ignored */
            FileName: assetNameOverride ? assetNameOverride : asset.FileName,
            idUserCreator: opInfo.idUser,
            DateCreated,
            StorageHash: resStorage.storageHash ? resStorage.storageHash : /* istanbul ignore next */ '',
            StorageSize: resStorage.storageSize ? BigInt(resStorage.storageSize) : /* istanbul ignore next */ BigInt(0),
            StorageKeyStaging: storageKey,
            Ingested,
            BulkIngest,
            idSOAttachment: idSOAttachment ?? null,
            FilePath,
            Comment: opInfo.message,
            idAssetVersion: 0
        });

        /* istanbul ignore if */
        if (!await assetVersion.create()) {
            RK.logError(RK.LogSection.eSTR,'create asset constellation failed','unable to create asset version',{ ...context, idAssetVersion: assetVersion.idAssetVersion },'AssetStorageAdapter');
            return null;
        } /* istanbul ignore next */

        if (!await AssetStorageAdapter.storeBulkIngestMetadata(assetVersion, opInfo.idUser, ingestedObject)) {
            RK.logError(RK.LogSection.eSTR,'create asset constellation failed','cannot store bulk ingest metadata',{ ...context, idAssetVersion: assetVersion.idAssetVersion, ingestedObject },'AssetStorageAdapter');
            return null;
        }
        return assetVersion;
    }

    private static async storeBulkIngestMetadata(assetVersion: DBAPI.AssetVersion, idUserCreator: number, ingestedObject: IngestMetadata | null): Promise<boolean> {
        if (!ingestedObject)
            return true;

        const context = { fileName: assetVersion.FileName, idAsset: assetVersion.idAsset, idAssetVersion: assetVersion.idAssetVersion };

        const SO: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject(); /* istanbul ignore next */
        if (!SO) {
            RK.logError(RK.LogSection.eSTR,'store bulk metadata failed','unable to fetch system object for asset version',{ ...context },'AssetStorageAdapter');
            return false;
        }

        const vocabulary: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eMetadataMetadataSourceBulkIngestion);
        const metadata: DBAPI.Metadata = new DBAPI.Metadata({
            Name: 'Bulk Ingestion',
            ValueShort: null,
            ValueExtended: JSON.stringify(ingestedObject, H.Helpers.saferStringify),
            idAssetVersionValue: null,
            idUser: idUserCreator,
            idVMetadataSource: vocabulary ? vocabulary.idVocabulary : /* istanbul ignore next */ null,
            idSystemObject: SO.idSystemObject,
            idSystemObjectParent: SO.idSystemObject,
            idMetadata: 0
        }); /* istanbul ignore next */

        if (!await metadata.create()) {
            RK.logError(RK.LogSection.eSTR,'store bulk metadata failed','unable to create metadata',{ ...context, metadata },'AssetStorageAdapter');
            return false;
        }
        return true;
    }

    static async extractBulkIngestMetadata(assetVersion: DBAPI.AssetVersion): Promise<IngestMetadata | null> {

        const context = { fileName: assetVersion.FileName, idAsset: assetVersion.idAsset, idAssetVersion: assetVersion.idAssetVersion };

        const SO: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject();
        const metadataList: DBAPI.Metadata[] | null = SO ? await DBAPI.Metadata.fetchFromSystemObject(SO.idSystemObject) : /* istanbul ignore next */ null; /* istanbul ignore next */
        if (!metadataList) {
            RK.logError(RK.LogSection.eSTR,'extract bulk metadata failed','unable to fetch metadata from system object',{ ...context, idAssetVersionSO: SO?.idSystemObject },'AssetStorageAdapter');
            return null;
        }

        const vocabulary: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eMetadataMetadataSourceBulkIngestion); /* istanbul ignore next */
        if (!vocabulary) {
            RK.logError(RK.LogSection.eSTR,'extract bulk metadata failed','unable to fetch vocabulary byt Enum',{ ...context },'AssetStorageAdapter');
            return null;
        }

        for (const metadata of metadataList) { /* istanbul ignore next */
            if (metadata.idVMetadataSource != vocabulary.idVocabulary || !metadata.ValueExtended)
                continue;
            // Found it!
            try {
                RK.logInfo(RK.LogSection.eSTR,'extract bulk metadata success',undefined,{ ...context, metadata },'AssetStorageAdapter');
                return JSON.parse(metadata.ValueExtended);
            } catch (error) {
                RK.logError(RK.LogSection.eSTR,'extract bulk metadata failed',H.Helpers.getErrorString(error),{ ...context, metadata },'AssetStorageAdapter');
                return null;
            }
        }
        return null;
    }

    static async ingestAsset(ingestAssetInput: IngestAssetInput): Promise<IngestAssetResult> {
        const { SOBased, idSystemObject, Comment, doNotUpdateParentVersion } = ingestAssetInput;
        const context = { fileName: ingestAssetInput.assetVersion.FileName, idAsset: ingestAssetInput.assetVersion.idAsset, idAssetVersion: ingestAssetInput.assetVersion.idAssetVersion };

        if (!idSystemObject && !SOBased) {
            const error: string = 'ingestAsset called without system object information';
            RK.logError(RK.LogSection.eSTR,'ingest asset failed','called without system object information',{ ...context },'AssetStorageAdapter');
            return { success: false, error };
        }

        if (!idSystemObject && SOBased) {
            const SO: DBAPI.SystemObject | null = await SOBased.fetchSystemObject();
            /* istanbul ignore if */
            if (!SO) {
                const error: string = `Unable to fetch SystemObject for ${SO}`;
                RK.logError(RK.LogSection.eSTR,'ingest asset failed','unable to fetch SystemObject',{ ...context },'AssetStorageAdapter');
                return { success: false, error };
            }
            ingestAssetInput.idSystemObject = SO.idSystemObject;
        }

        const IAR: IngestAssetResult = await AssetStorageAdapter.ingestAssetWorker(ingestAssetInput);
        if (!IAR.success || !ingestAssetInput.idSystemObject) {
            RK.logError(RK.LogSection.eSTR,'ingest asset failed','unable to create ingest worker',{ ...context },'AssetStorageAdapter');
            return IAR;
        }

        const assetVersionOverrideMap: Map<number, number> = new Map<number, number>();
        if (IAR.assetVersions) {
            for (const assetVersion of IAR.assetVersions)
                assetVersionOverrideMap.set(assetVersion.idAsset, assetVersion.idAssetVersion);
        }

        const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(ingestAssetInput.idSystemObject, null, Comment,
            assetVersionOverrideMap, IAR.assetsUnzipped);
        if (!SOV) {
            IAR.success = false;
            IAR.error = 'DB Failure creating SystemObjectVersion';
            RK.logError(RK.LogSection.eSTR,'ingest asset failed',`cannot clone object and xrefs: ${IAR.error}`,{ ...context },'AssetStorageAdapter');
            return IAR;
        }
        IAR.systemObjectVersion = SOV;

        if (doNotUpdateParentVersion !== true) {
            // Complex system object version patch up step here
            // Scenes own Models, Models own Assets; those assets are *also* part of the scene's system object version
            // So, when we update a model-owned asset, we also need to add a new system object version for that scene!
            if (IAR.affectedSystemObjectIds && IAR.affectedSystemObjectIds.size > 0) {
                RK.logDebug(RK.LogSection.eSTR,'ingest asset','found affected system objects',{ ...context, affectedObjectIDs: IAR.affectedSystemObjectIds },'AssetStorageAdapter');
                for (const idSystemObject of IAR.affectedSystemObjectIds) {
                    if (idSystemObject !== ingestAssetInput.idSystemObject) { // we've already updated ingestAssetInput.idSystemObject above
                        const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(idSystemObject, null, Comment, assetVersionOverrideMap, IAR.assetsUnzipped);
                        if (!SOV)
                            RK.logError(RK.LogSection.eSTR,'ingest asset failed','failed to create new SystemObjectVersion',{ ...context },'AssetStorageAdapter');
                    }
                }
            } else
                RK.logDebug(RK.LogSection.eSTR,'ingest asset','found no affected system objects. ignoring updating parent version',{ ...context },'AssetStorageAdapter');
        }

        RK.logInfo(RK.LogSection.eSTR,'ingest asset success',undefined,{ ...context },'AssetStorageAdapter',true);
        return IAR;
    }

    private static async ingestAssetWorker(ingestAssetInput: IngestAssetInput): Promise<IngestAssetResult> {
        const { asset, assetVersion, allowZipCracking, idSystemObject, opInfo } = ingestAssetInput;
        const context = { fileName: asset.FileName, idAsset: asset.idAsset, idAssetVersion: assetVersion.idAssetVersion, idAssetVersionSO: idSystemObject };

        if (!idSystemObject) {
            const error: string = 'ingestAssetWorker called with missing value for idSystemObject';
            RK.logError(RK.LogSection.eSTR,'ingest asset worker failed','called with missing idSystemObject',{ ...context },'AssetStorageAdapter');
            return { success: false, error };
        }

        // Call IStorage.promote
        // Update asset.StorageKey and assetVersion.Ingested to true, if needed (may not be needed for bulk ingests and zips)
        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            const error: string = 'ingestAssetWorker: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            RK.logError(RK.LogSection.eSTR,'ingest asset worker failed','unable to retrieve storage implementation from factory',{ ...context },'AssetStorageAdapter');
            return { success: false, error };
        }

        const metadata: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(idSystemObject, DBAPI.eObjectGraphMode.eAncestors); /* istanbul ignore next */
        if (!await metadata.fetch()) {
            const error: string = `ingestAssetWorker: Update to retrieve object ancestry for system object ${idSystemObject}`;
            RK.logError(RK.LogSection.eSTR,'ingest asset worker failed','unable to retrieve object ancestry',{ ...context },'AssetStorageAdapter');
            return { success: false, error };
        }

        let IAR: IngestAssetResult;
        const isZipFilename: boolean = (path.extname(assetVersion.FileName).toLowerCase() === '.zip');
        const eAssetType: COMMON.eVocabularyID | undefined = await asset.assetType();
        const unzipAssets: boolean = allowZipCracking && isZipFilename &&
            (eAssetType == COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry ||
             eAssetType == COMMON.eVocabularyID.eAssetAssetTypeCaptureDataFile ||
             eAssetType == COMMON.eVocabularyID.eAssetAssetTypeModel ||
             eAssetType == COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile ||
             eAssetType == COMMON.eVocabularyID.eAssetAssetTypeScene);
        if (assetVersion.BulkIngest || unzipAssets) {
            // Use bulkIngestReader to extract contents for assets in and below asset.FilePath
            const CAR: CrackAssetResult = await AssetStorageAdapter.crackAssetWorker(storage, asset, assetVersion); /* istanbul ignore next */
            if (!CAR.success || !CAR.zip)
                return { success: false, error: CAR.error };
            IAR = await AssetStorageAdapter.ingestAssetBulkZipWorker(storage, asset, assetVersion, metadata, opInfo, CAR.zip, assetVersion.BulkIngest);
            await CAR.zip.close();
        } else {
            const affectedSystemObjectIds: Set<number> | null = await DBAPI.SystemObject.computeAffectedByUpdate([asset.idAsset]);
            const ASR: AssetStorageResult = await AssetStorageAdapter.promoteAssetWorker(storage, asset, assetVersion, metadata, opInfo, null);
            if (!ASR.success || !ASR.asset || !ASR.assetVersion)
                IAR = { success: false, error: ASR.error };
            else
                IAR = { success: true, assets: [ASR.asset], assetVersions: [ASR.assetVersion], systemObjectVersion: null, assetsIngested: true, affectedSystemObjectIds };
        }

        // Send Workflow Ingestion event
        if (ingestAssetInput.doNotSendIngestionEvent === undefined || ingestAssetInput.doNotSendIngestionEvent === false)
            await AssetStorageAdapter.sendWorkflowIngestionEvent(IAR, opInfo.idUser);

        if(IAR.success===false)
            RK.logError(RK.LogSection.eSTR,'ingest asset worker failed','called with missing idSystemObject',{ ...context },'AssetStorageAdapter');
        else
            RK.logDebug(RK.LogSection.eSTR,'ingest asset worker success',undefined,{ ...context },'AssetStorageAdapter');

        return IAR;
    }

    private static async sendWorkflowIngestionEvent(IAR: IngestAssetResult, idUser: number): Promise<H.IOResults> {
        if (!IAR.assetVersions)
            return { success: true };

        const context = { assets: IAR.assetVersions?.map(a => { return { idAsset: a.idAsset, fileName: a.FileName, idAssetVersion: a.idAssetVersion };}) ?? null };

        let error: string | undefined = undefined;
        const workflowEngine: WF.IWorkflowEngine | null = await WF.WorkflowFactory.getInstance();
        if (!workflowEngine) {
            error = 'ingestData createWorkflow could not load WorkflowEngine';
            RK.logError(RK.LogSection.eSTR,'send ingestion event failed',error,{ ...context },'AssetStorageAdapter');
            return { success: false, error };
        }

        // ingest the scene and detect changes for additional events/logic
        const { transformUpdated } = await AssetStorageAdapter.detectAndHandleSceneIngest(IAR);
        // transformUpdated = false; // HACK: setting transform update to 'false' to always accept incoming scene as truth

        // prepare to wire together ingestion workflow step with output asset versions (in systemObjectSet)
        const LS: LocalStore | undefined = await ASL.getStore();
        const idWorkflow: number | undefined = (LS) ? LS.getWorkflowID() : undefined;
        const workflowSteps: DBAPI.WorkflowStep[] | null = idWorkflow ? await DBAPI.WorkflowStep.fetchFromWorkflow(idWorkflow) : null;
        const workflowStep: DBAPI.WorkflowStep | null = (workflowSteps && workflowSteps.length > 0) ? workflowSteps[workflowSteps.length - 1] : null;

        const systemObjectSet: Set<number> = new Set<number>();
        for (const assetVersion of IAR.assetVersions) {
            const oID: DBAPI.ObjectIDAndType = { idObject: assetVersion.idAssetVersion, eObjectType: COMMON.eSystemObjectType.eAssetVersion };
            const sysInfo: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
            if (!sysInfo) {
                RK.logError(RK.LogSection.eSTR,'send ingestion event failed','could not find system object',{ ...context, ...oID },'AssetStorageAdapter');
                continue;
            }
            systemObjectSet.add(sysInfo.idSystemObject);
        }

        const idSystemObject: number[] = [];
        for (const idSystemObjectDistinct of systemObjectSet.values()) {
            idSystemObject.push(idSystemObjectDistinct);
            if (workflowStep) {
                const WSSOX: DBAPI.WorkflowStepSystemObjectXref = new DBAPI.WorkflowStepSystemObjectXref({
                    idWorkflowStep: workflowStep.idWorkflowStep,
                    idSystemObject: idSystemObjectDistinct,
                    Input: false,
                    idWorkflowStepSystemObjectXref: 0
                });
                if (!await WSSOX.create()) {
                    RK.logError(RK.LogSection.eSTR,'send ingestion event failed','failed to create WorkflowStep xref',{ ...context, ...H.Helpers.extractProperties(WSSOX) },'AssetStorageAdapter');
                }
            }
        }

        const wfReport: REP.IReport | null = await REP.ReportFactory.getReport();
        if (wfReport) {
            let message: string = 'Sending WorkflowEngine IngestObject event';
            if (IAR.systemObjectVersion?.idSystemObject) {
                const pathObject: string = RouteBuilder.RepositoryDetails(IAR.systemObjectVersion.idSystemObject, eHrefMode.ePrependClientURL);
                const hrefObject: string = H.Helpers.computeHref(pathObject, `System Object ${IAR.systemObjectVersion.idSystemObject}`);
                message += ` for ${hrefObject}`;
            }
            const ret: H.IOResults = await wfReport.append(message);
            if (!ret.success)
                RK.logError(RK.LogSection.eSTR,'send ingestion event failed','unable to append to workflow report',{ ...context, message },'AssetStorageAdapter');
        }

        const parameters = {
            modelTransformUpdated: transformUpdated,
            assetsIngested: IAR.assetsIngested
        };

        const workflowParams: WF.WorkflowParameters = {
            idSystemObject,
            // idProject: TODO: update with project ID
            idUserInitiator: idUser,
            parameters
        };

        // send workflow engine event, but don't wait for results
        workflowEngine.event(COMMON.eVocabularyID.eWorkflowEventIngestionIngestObject, workflowParams);
        return { success: error === undefined ? true : false, error };
    }

    private static async detectAndHandleSceneIngest(IAR: IngestAssetResult): Promise<{ success: boolean, transformUpdated: boolean }> {
        // LOG.info(`AssetStorageAdapter.detectAndHandleSceneIngest called with IngestAssetResult of ${JSON.stringify(IAR, H.Helpers.saferStringify)}`, LOG.LS.eSTR);

        if (!IAR.assets || !IAR.assetVersions) {
            RK.logError(RK.LogSection.eSTR,'handle scene ingest failed','called without assets or asset versions',{ ...IAR },'AssetStorageAdapter');
            return { success: false, transformUpdated: false };
        }

        // first, identify assets and asset versions for the scene and models
        let sceneAsset: DBAPI.Asset | null = null;
        let sceneAssetVersion: DBAPI.AssetVersion | undefined = undefined;

        const assetVersionMap: Map<number, DBAPI.AssetVersion> = new Map<number, DBAPI.AssetVersion>(); // map of *asset* id -> asset version
        for (const assetVersion of IAR.assetVersions)
            assetVersionMap.set(assetVersion.idAsset, assetVersion); // idAsset is correct here!

        for (const asset of IAR.assets) {
            switch (await asset.assetType()) {
                case COMMON.eVocabularyID.eAssetAssetTypeScene:
                    if (!sceneAsset) {
                        sceneAsset = asset;
                        sceneAssetVersion = assetVersionMap.get(asset.idAsset);
                    } else
                        RK.logError(RK.LogSection.eSTR,'handle scene ingest failed','skipping unexpected scene',{ ...asset },'AssetStorageAdapter');
                    break;

                case undefined:
                    RK.logError(RK.LogSection.eSTR,'handle scene ingest failed','unable to detect asset type',{ ...asset },'AssetStorageAdapter');
                    break;
            }
        }

        if (!sceneAsset || !sceneAssetVersion) {
            RK.logDebug(RK.LogSection.eSTR,'handle scene ingest success','did not locate scene info',{ ...IAR },'AssetStorageAdapter');
            return { success: true, transformUpdated: false };
        }

        const SOScene: DBAPI.SystemObject | null = sceneAsset.idSystemObject ? await DBAPI.SystemObject.fetch(sceneAsset.idSystemObject) : null;
        if (!SOScene || !SOScene.idScene) {
            RK.logError(RK.LogSection.eSTR,'handle scene ingest failed','unable to identify scene system object for the ingested asset',{ ...H.Helpers.extractProperties(sceneAsset) },'AssetStorageAdapter');
            return { success: false, transformUpdated: false };
        }

        // next, retrieve & parse the scene, extracting model references and transforms
        const RSR: STORE.ReadStreamResult = await AssetStorageAdapter.readAsset(sceneAsset, sceneAssetVersion);
        if (!RSR.success || !RSR.readStream) {
            RK.logError(RK.LogSection.eSTR,'handle scene ingest failed','unable to fetch stream for scene asset',{ ...H.Helpers.extractProperties(sceneAsset) },'AssetStorageAdapter');
            return { success: false, transformUpdated: false };
        }

        const svx: SvxReader = new SvxReader();
        const res: H.IOResults = await svx.loadFromStream(RSR.readStream);
        if (!res.success || !svx.SvxExtraction) {
            RK.logError(RK.LogSection.eSTR,'handle scene ingest failed',`unable to parse scene asset: ${res.error}`,{ ...H.Helpers.extractProperties(sceneAsset) },'AssetStorageAdapter');
            return { success: false, transformUpdated: false };
        }

        RK.logDebug(RK.LogSection.eSTR,'handle scene ingest failed','extracted SVX model details',{ modelDetails: svx.SvxExtraction.modelDetails },'AssetStorageAdapter');

        // finally, update ModelSceneXref for each model reference:
        let success: boolean = true;
        let transformUpdated: boolean = false;
        if (svx.SvxExtraction.modelDetails) {
            for (const MSX of svx.SvxExtraction.modelDetails) {
                if (!MSX.Name)
                    continue;

                // look for matching ModelSceneXref from SOScene.idScene, MSX.Name, .Usage, .Quality, .UVResolution
                // if not found, indicate that transform has been updated
                // if found, determine if MSX transform has changed; if so, update MSX, and return a status that can be used to kick off download generation workflow
                const MSXSources: DBAPI.ModelSceneXref[] | null =
                    await DBAPI.ModelSceneXref.fetchFromSceneNameUsageQualityUVResolution(SOScene.idScene, MSX.Name, MSX.Usage, MSX.Quality, MSX.UVResolution);
                const MSXSource: DBAPI.ModelSceneXref | null = (MSXSources && MSXSources.length > 0) ? MSXSources[0] : null;
                if (MSXSource) {
                    // LOG.info(`AssetStorageAdapter.detectAndHandleSceneIngest found existing ModelSceneXref=${JSON.stringify(MSXSource, H.Helpers.saferStringify)} from referenced model ${JSON.stringify(MSX, H.Helpers.saferStringify)}`, LOG.LS.eSTR);
                    RK.logDebug(RK.LogSection.eSTR,'handle scene ingest failed','found existing model scene xref',{ MSX, MSXSource },'AssetStorageAdapter');
                    const { transformUpdated: transformUpdatedLocal, updated } = MSXSource.updateIfNeeded(MSX);
                    if (updated) {
                        if (!await MSXSource.update()) {
                            RK.logError(RK.LogSection.eSTR,'handle scene ingest failed','unable to update model scene xref',{ MSXSource },'AssetStorageAdapter');
                            success = false;
                        }
                    }
                    if (transformUpdatedLocal)
                        transformUpdated = true;
                } else {
                    // Could not find the ModelSceneXref
                    transformUpdated = true;
                    RK.logWarning(RK.LogSection.eSTR,'handle scene ingest failed','did not find existing model scene xref',{ MSX },'AssetStorageAdapter');
                    continue;
                }
            }
        }

        return { success, transformUpdated };
    }

    private static async ingestAssetBulkZipWorker(storage: IStorage, asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion,
        metadata: DBAPI.ObjectGraph, opInfo: STORE.OperationInfo, zip: IZip, bulkIngest: boolean): Promise<IngestAssetResult> {
        const assets: DBAPI.Asset[] = [];
        const assetVersions: DBAPI.AssetVersion[] = [];
        const eAssetTypeMaster: COMMON.eVocabularyID | undefined = await VocabularyCache.vocabularyIdToEnum(asset.idVAssetType);
        let IAR: IngestAssetResult = { success: true };
        let assetsIngested: boolean = false;
        let affectedSystemObjectIds: Set<number> | null = null;

        // for bulk ingest, the folder from the zip from which to extract assets is specified in asset.FilePath
        const fileID = bulkIngest ? `/${BAGIT_DATA_DIRECTORY}${assetVersion.FilePath}/` : '';
        for (const entry of (bulkIngest ? await zip.getAllEntries(null) : await zip.getJustFiles(null))) {

            if (bulkIngest && !entry.includes(fileID)) // only process assets found in our path
                continue;

            // Get a readstream to that part of the zip; compute hash and filesize
            let inputStream: NodeJS.ReadableStream | null = await zip.streamContent(entry); /* istanbul ignore next */
            if (!inputStream) {
                const error: string = `ingestAssetBulkZipWorker: unable to stream entry ${entry} of AssetVersion ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`;
                RK.logError(RK.LogSection.eSTR,'bulk ingest zip worker','unable to stream entry',{ entry, assetVersion },'AssetStorageAdapter');
                if (IAR.success)
                    IAR = { success: false, error, assets, assetVersions, systemObjectVersion: null };
                continue;
            }
            const hashResults: H.HashResults = await H.Helpers.computeHashFromStream(inputStream, ST.OCFLDigestAlgorithm); /* istanbul ignore next */
            if (!hashResults.success) {
                RK.logError(RK.LogSection.eSTR,'bulk ingest zip worker',`unable to compute hash: ${hashResults.error}`,{ entry, assetVersion },'AssetStorageAdapter');
                if (IAR.success)
                    IAR = { success: false, error: hashResults.error, assets, assetVersions, systemObjectVersion: null };
                continue;
            }

            // Get a second readstream to that part of the zip, to reset stream position after computing the hash
            inputStream = await zip.streamContent(entry); /* istanbul ignore next */
            if (!inputStream) {
                const error: string = `ingestAssetBulkZipWorker: unable to stream entry ${entry} of AssetVersion (reset) ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`;
                RK.logError(RK.LogSection.eSTR,'bulk ingest zip worker','unable to stream entry',{ entry, assetVersion },'AssetStorageAdapter');
                if (IAR.success)
                    IAR = { success: false, error, assets, assetVersions, systemObjectVersion: null };
                continue;
            }

            // Determine asset type
            let eAssetType: COMMON.eVocabularyID;
            let ingested: boolean | null = false;
            const unzippedFileName: string = path.basename(entry);
            switch (eAssetTypeMaster) {
                case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry:
                case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataFile:
                    eAssetType = COMMON.eVocabularyID.eAssetAssetTypeCaptureDataFile;
                    break;

                case COMMON.eVocabularyID.eAssetAssetTypeModel:
                case COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile:
                    ingested = null;
                    if (await CACHE.VocabularyCache.mapModelFileByExtensionID(unzippedFileName) !== undefined)
                        eAssetType = COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile;
                    else {
                        const mimeType: string | null = mime.lookup(unzippedFileName);
                        if (mimeType && mimeType.startsWith('image/'))
                            eAssetType = COMMON.eVocabularyID.eAssetAssetTypeModelUVMapFile;
                        else
                            eAssetType = COMMON.eVocabularyID.eAssetAssetTypeOther;
                    }
                    break; /* istanbul ignore next */

                // case COMMON.eVocabularyID.eAssetAssetTypeScene:
                //     if (unzippedFileName.toLowerCase().endsWith('.svx.json'))
                //         eAssetType = COMMON.eVocabularyID.eAssetAssetTypeScene;
                //     else if (await CACHE.VocabularyCache.mapModelFileByExtensionID(unzippedFileName) !== undefined)
                //         eAssetType = COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile;
                //     else
                //         eAssetType = COMMON.eVocabularyID.eAssetAssetTypeOther;
                //     break; /* istanbul ignore next */
                case COMMON.eVocabularyID.eAssetAssetTypeScene: {
                    const lowerName: string = unzippedFileName.toLowerCase();

                    if (lowerName.endsWith('.svx.json'))
                        eAssetType = COMMON.eVocabularyID.eAssetAssetTypeScene;
                    else if (await CACHE.VocabularyCache.mapModelFileByExtensionID(unzippedFileName) !== undefined)
                        eAssetType = COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile;
                    else if (AssetStorageAdapter.isSceneDownloadZipFile(unzippedFileName))
                        eAssetType = COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile;
                    else
                        eAssetType = COMMON.eVocabularyID.eAssetAssetTypeOther;
                    break;
                } /* istanbul ignore next */

                default:
                    RK.logError(RK.LogSection.eSTR,'bulk ingest zip worker','unsupported asset type',{ asset },'AssetStorageAdapter');
                    eAssetType = COMMON.eVocabularyID.eAssetAssetTypeOther;
                    break;
            }
            const idVAssetType: number | undefined = await VocabularyCache.vocabularyEnumToId(eAssetType); /* istanbul ignore next */
            if (!idVAssetType) {
                const error: string = `ingestAssetBulkZipWorker: unable to compute asset type of Asset ${JSON.stringify(asset, H.Helpers.saferStringify)}`;
                RK.logError(RK.LogSection.eSTR,'bulk ingest zip worker','unable to compute asset type',{ asset },'AssetStorageAdapter');
                if (IAR.success)
                    IAR = { success: false, error, assets, assetVersions, systemObjectVersion: null };
                continue;
            }

            // find/create asset and asset version
            const FileName: string = path.basename(entry);
            let FilePath: string = path.dirname(entry);
            if (FilePath === '.')
                FilePath = '';

            let promoteAssetNeeded: boolean = false;
            let assetVersionComponent: DBAPI.AssetVersion | null = null;
            let assetComponent: DBAPI.Asset | null = asset.idSystemObject ?
                await DBAPI.Asset.fetchMatching(asset.idSystemObject, FileName, idVAssetType) : null;

            if (assetComponent) {
                RK.logDebug(RK.LogSection.eSTR,'bulk ingest zip worker','found matching idSystemObject',{ assetComponent },'AssetStorageAdapter');
                // examine most recent asset version, if any; if the hash matches, avoid creating a new version
                assetVersionComponent = await DBAPI.AssetVersion.fetchLatestFromAsset(assetComponent.idAsset);
                if (assetVersionComponent && assetVersionComponent.StorageHash === hashResults.hash) {
                    RK.logDebug(RK.LogSection.eSTR,'bulk ingest zip worker','found matching asset version',{ assetVersionComponent },'AssetStorageAdapter');
                    if (assetVersionComponent.FileName !== FileName || assetVersionComponent.FilePath !== FilePath) {  // Found the right asset version!  If necessary, update the filename & path
                        assetVersionComponent.FileName = FileName;
                        assetVersionComponent.FilePath = FilePath;
                        if (!await assetVersionComponent.update())
                            RK.logError(RK.LogSection.eSTR,'bulk ingest zip worker','unable to update asset version',{ assetVersionComponent },'AssetStorageAdapter');
                    }
                } else {
                    RK.logError(RK.LogSection.eSTR,'bulk ingest zip worker','cannot find asset version for hash',{ hash: hashResults.hash, assetVersionComponent },'AssetStorageAdapter');
                    assetVersionComponent = null;
                }
            } else {
                RK.logDebug(RK.LogSection.eSTR,'bulk ingest zip worker','cannot find asset idSystemObject. creating new.',{ entry, asset },'AssetStorageAdapter');
                assetComponent = new DBAPI.Asset({ FileName, idAssetGroup: 0, idVAssetType, idSystemObject: asset.idSystemObject, StorageKey: null, idAsset: 0 });
            }

            // create asset version here; gather affected system objects, each of which will need new system object versions, down below:
            if (!assetVersionComponent) {
                const affectedSOs: Set<number> | null = await DBAPI.SystemObject.computeAffectedByUpdate([assetComponent.idAsset]);
                if (affectedSOs)
                    affectedSystemObjectIds = affectedSystemObjectIds ? new Set([...affectedSystemObjectIds, ...affectedSOs]) : affectedSOs;

                const CWSR: STORE.CommitWriteStreamResult = { storageHash: hashResults.hash, storageSize: hashResults.dataLength, success: true };
                assetVersionComponent = await AssetStorageAdapter.createAssetConstellation(assetComponent, FilePath, opInfo,
                    assetVersion.DateCreated, CWSR, '', false, null, null, null, ingested); /* istanbul ignore next */
                promoteAssetNeeded = true;
            }

            if (!assetVersionComponent) {
                const error: string = `ingestAssetBulkZipWorker unable to create AssetVersion from Asset ${JSON.stringify(asset, H.Helpers.saferStringify)}`;
                RK.logError(RK.LogSection.eSTR,'bulk ingest zip worker','unable to create asset version from asset',{ asset },'AssetStorageAdapter');
                if (IAR.success)
                    IAR = { success: false, error, assets, assetVersions, systemObjectVersion: null };
                continue;
            }

            // Create a storage key, Promote the asset, Update the asset
            if (promoteAssetNeeded) {
                const ASR: AssetStorageResult = await AssetStorageAdapter.promoteAssetWorker(storage, assetComponent, assetVersionComponent, metadata, opInfo, inputStream); /* istanbul ignore next */
                if (ASR.success)
                    assetsIngested = true;
                else {
                    const error: string = `ingestAssetBulkZipWorker unable to promote Asset ${JSON.stringify(asset, H.Helpers.saferStringify)}: ${ASR.error}`;
                    RK.logError(RK.LogSection.eSTR,'bulk ingest zip worker','unable to promote asset',{ entry, asset },'AssetStorageAdapter');
                    if (IAR.success)
                        IAR = { success: false, error, assets, assetVersions, systemObjectVersion: null };
                    continue;
                }
            }

            assets.push(assetComponent);
            assetVersions.push(assetVersionComponent);
        }

        if (!IAR.success)
            return IAR;

        // Discard the source file if we're the last one using it, retire the asset version, clear the StorageKeyStaging, and retire the asset if all versions are retired
        const ASR: AssetStorageResult = await AssetStorageAdapter.discardAssetVersion(assetVersion); /* istanbul ignore next */
        if (!ASR.success) {
            const error: string = `ingestAssetBulkZipWorker: ${ASR.error}`;
            RK.logError(RK.LogSection.eSTR,'bulk ingest zip worker',`unable to discard asset version: ${ASR.error}`,{ asset: ASR.asset, assetVersion },'AssetStorageAdapter');
            return { success: false, error, assets, assetVersions, systemObjectVersion: null };
        }

        RK.logDebug(RK.LogSection.eSTR,'bulk ingest zip worker success',undefined,{ assets: assetVersions.map(a=>{ return { idAsset: a.idAsset, fileName: a.FileName, idAssetVersion: a.idAssetVersion };}) },'AssetStorageAdapter');
        return { success: true, assets, assetVersions, systemObjectVersion: null, assetsUnzipped: true, assetsIngested, affectedSystemObjectIds };
    }

    private static async retireAssetIfAllVersionsAreRetired(asset: DBAPI.Asset): Promise<H.IOResults> {

        const assetVersionsNotRetired: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchFromAsset(asset.idAsset, false);
        if (!assetVersionsNotRetired) {
            const error: string = `retireAssetIfAllVersionsAreRetired: unable to compute non-retired asset versions from asset ${JSON.stringify(asset, H.Helpers.saferStringify)}`;
            RK.logError(RK.LogSection.eSTR,'retire asset failed','unable to compute non-retired asset versions from asset',{ asset },'AssetStorageAdapter');
            return { success: false, error };
        }
        if (assetVersionsNotRetired.length > 0) {
            RK.logDebug(RK.LogSection.eSTR,'retire asset success',undefined,{ asset },'AssetStorageAdapter');
            return { success: true };
        }

        if (!await DBAPI.SystemObject.retireSystemObject(asset)) {
            const error: string = `retireAssetIfAllVersionsAreRetired: unable to retire Asset ${JSON.stringify(asset, H.Helpers.saferStringify)}`;
            RK.logError(RK.LogSection.eSTR,'retire asset failed','unable to retire Asset',{ asset },'AssetStorageAdapter');
            return { success: false, error };
        }

        RK.logDebug(RK.LogSection.eSTR,'retire asset success',undefined,{ asset },'AssetStorageAdapter');
        return { success: true };
    }

    private static async promoteAssetWorker(storage: IStorage, asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion,
        objectGraph: DBAPI.ObjectGraph, opInfo: STORE.OperationInfo, inputStream: NodeJS.ReadableStream | null): Promise<AssetStorageResult> {

        let storageKey: string = (asset.idAsset > 0 && asset.StorageKey) ? asset.StorageKey : '';
        if (!storageKey) {
            const storageKeyResults = await storage.computeStorageKey(asset.idAsset.toString()); /* istanbul ignore next */
            if (!storageKeyResults.success) {
                RK.logError(RK.LogSection.eSTR,'promote asset worker failed',storageKeyResults.error,{ asset, assetVersion },'AssetStorageAdapter');
                return { asset, assetVersion, success: false, error: storageKeyResults.error };
            } else
                storageKey = storageKeyResults.storageKey;
        }

        const promoteStagedAssetInput: STORE.PromoteStagedAssetInput = {
            storageKeyStaged: assetVersion.StorageKeyStaging,
            storageKeyFinal: storageKey,
            fileName: assetVersion.FileName,
            inputStream,
            metadata: await objectGraph.toPersist(),
            opInfo
        };

        const resStorage = await storage.promoteStagedAsset(promoteStagedAssetInput);
        if (!resStorage.success) {
            RK.logError(RK.LogSection.eSTR,'promote asset worker failed',resStorage.error,{ asset, assetVersion },'AssetStorageAdapter');
            return { asset, assetVersion, success: false, error: resStorage.error };
        }

        // Update Asset if new information is being provided here
        // StorageKey should be updated only the first time we ingest
        let updateAsset: boolean = false;
        if (asset.idSystemObject != objectGraph.idSystemObject) {
            asset.idSystemObject = objectGraph.idSystemObject;
            updateAsset = true;
        }
        if (asset.StorageKey != storageKey) {
            asset.StorageKey = storageKey;
            updateAsset = true;
        }
        if (updateAsset) /* istanbul ignore next */ {
            if (!await asset.update()) {
                const error: string = `AssetStorageAdapter.ingestAsset: Unable to update Asset ${JSON.stringify(asset, H.Helpers.saferStringify)}`;
                RK.logError(RK.LogSection.eSTR,'promote asset worker failed','Unable to update Asset',{ asset },'AssetStorageAdapter');
                return { asset, assetVersion, success: false, error };
            }
        }

        assetVersion.Ingested = true;
        assetVersion.StorageKeyStaging = ''; /* istanbul ignore next */
        if (opInfo.message)
            assetVersion.Comment = opInfo.message;
        if (!await assetVersion.update()) {
            const error: string = `ingestAsset: Unable to update AssetVersion ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`;
            RK.logError(RK.LogSection.eSTR,'promote asset worker failed','Unable to update AssetVersion',{ assetVersion },'AssetStorageAdapter');
            return { asset, assetVersion, success: false, error };
        }

        // Extract metadata; note that we do this using the promoted asset & asset version
        // Staged content would be easier to fetch, but it may be coming in via a zip stream,
        // which we cannot simply read and then re-read for ingestion.
        let res: H.IOResults = { success: true };
        const extractor: META.MetadataExtractor = new META.MetadataExtractor();
        const AFOSR: AssetFileOrStreamResult = await AssetStorageAdapter.assetFileOrStream(storage, asset, assetVersion);
        if (AFOSR.success && (AFOSR.fileName || AFOSR.stream)) {
            res = await extractor.extractMetadata(AFOSR.fileName ?? '', AFOSR.stream);
            if (AFOSR.stream)
                H.Helpers.destroyReadStream(AFOSR.stream);
        } else
            RK.logError(RK.LogSection.eSTR,'promote asset worker failed',`unable to compute metadata for asset: ${AFOSR.error}`,{ asset },'AssetStorageAdapter');

        // Persist extracted metadata
        if (res.success) {
            const SO: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject();
            if (!SO)
                RK.logError(RK.LogSection.eSTR,'promote asset worker failed','unable to fetch system object for asset version',{ assetVersion },'AssetStorageAdapter');

            RK.logDebug(RK.LogSection.eSTR,'promote asset worker','persistingmetadata key/values for asset',{ asset, numFields: extractor.metadata.size },'AssetStorageAdapter');

            const idSystemObject: number = SO ? SO.idSystemObject : objectGraph.idSystemObject;
            res = await META.MetadataManager.persistExtractor(idSystemObject, objectGraph.idSystemObject, extractor, assetVersion.idUserCreator);
            if (!res.success)
                RK.logError(RK.LogSection.eSTR,'promote asset worker failed',`unable to persist metadata for asset: ${res.error}`,{ asset },'AssetStorageAdapter');
        } else
            RK.logError(RK.LogSection.eSTR,'promote asset worker failed',`unable to extract metadata for asset: ${res.error}`,{ asset },'AssetStorageAdapter');

        RK.logDebug(RK.LogSection.eSTR,'promote asset worker success',undefined,{ fileName: asset.FileName, idAsset: asset.idAsset, idAssetVersion: assetVersion.idAssetVersion },'AssetStorageAdapter');
        return { asset, assetVersion, success: true }; // we always return true at this point; i.e. we do not treat metadata extraction failures as ingestion failure
    }

    static async ingestStreamOrFile(ISI: IngestStreamOrFileInput): Promise<IngestAssetResult> {

        const context = { fileName: ISI.FileName, hasStream: ISI.readStream ? true:false, localPath: ISI.localFilePath, type: ISI.idVAssetType, idAsset: ISI.asset?.idAsset ?? -1 };
        RK.logInfo(RK.LogSection.eSTR,'ingest stream or file start',undefined,{ ...context },'AssetStorageAdapter');

        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            const error: string = 'unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            RK.logError(RK.LogSection.eSTR,'ingest stream or file failed','unable to retrieve Storage Implementation from StorageFactory',{ ...context },'AssetStorageAdapter');
            return { success: false, error };
        }

        if (!ISI.idVAssetType) { // !ISI.idUserCreator ||
            const error: string = 'missing required parameters';
            RK.logError(RK.LogSection.eSTR,'ingest stream or file failed','missing required parameters',{ ...context },'AssetStorageAdapter');
            return { success: false, error };
        }

        const wsRes: STORE.WriteStreamResult = await storage.writeStream(ISI.FileName);
        if (!wsRes.success || !wsRes.writeStream || !wsRes.storageKey) {
            const error: string = `unable to create write stream for ${ISI.FileName}: ${wsRes.error}`;
            RK.logError(RK.LogSection.eSTR,'ingest stream or file failed',`unable to create write stream: ${wsRes.error}`,{ ...context },'AssetStorageAdapter');
            return { success: false, error };
        }

        if (!ISI.readStream) {
            if (!ISI.localFilePath) {
                const error: string = 'called without either ReadStream or LocalFilePath specified';
                RK.logError(RK.LogSection.eSTR,'ingest stream or file failed','called without either ReadStream or LocalFilePath specified',{ ...context },'AssetStorageAdapter');
                return { success: false, error };
            }
            ISI.readStream = fs.createReadStream(ISI.localFilePath);
        }

        // make sure both streams are valid
        if(ISI.readStream.readable===false || wsRes.writeStream.writable===false) {
            const error: string = `individual streams are not valid. (read: ${ISI.readStream.readable} | write: ${wsRes.writeStream.writable})`;
            RK.logError(RK.LogSection.eSTR,'ingest stream or file failed','individual streams are not valid',{ ...context, readStream: ISI.readStream.readable, writeStream: wsRes.writeStream.writable  },'AssetStorageAdapter');
            return { success: false, error };
        }

        try {
            const wrRes: H.IOResults = await H.Helpers.writeStreamToStream(ISI.readStream, wsRes.writeStream);
            if (!wrRes.success) {
                const error: string = `unable to write to stream: ${wrRes.error}`;
                RK.logError(RK.LogSection.eSTR,'ingest stream or file failed',error,{ ...context },'AssetStorageAdapter');
                return { success: false, error };
            }
        } finally {
            wsRes.writeStream.end();
        }

        let comRes: STORE.AssetStorageResultCommit | null = null;
        const opInfo: STORE.OperationInfo | null = await STORE.AssetStorageAdapter.computeOperationInfo(ISI.idUserCreator, `Ingesting asset ${ISI.FileName}`);
        if (!opInfo) {
            const error: string = `Unable to compute operation info from user ${ISI.idUserCreator}`;
            RK.logError(RK.LogSection.eSTR,'ingest stream or file failed','Unable to compute operation info from user',{ ...context, idUser: ISI.idUserCreator },'AssetStorageAdapter');
            return { success: false, error };
        }

        // if we don't have an existing asset passed in commit a new one, otherwise commit a new version
        if (!ISI.asset) {
            comRes = await STORE.AssetStorageAdapter.commitNewAsset({
                storageKey: wsRes.storageKey,
                storageHash: null,
                FileName: ISI.FileName,
                FilePath: ISI.FilePath,
                idAssetGroup: 0,
                idVAssetType: ISI.idVAssetType,
                opInfo,
                DateCreated: new Date()
            });
        } else
            comRes = await STORE.AssetStorageAdapter.commitNewAssetVersion({
                storageKey: wsRes.storageKey,
                storageHash: null,
                asset: ISI.asset,
                assetNameOverride: null,
                FilePath: ISI.FilePath,
                opInfo,
                DateCreated: new Date()
            });

        if (!comRes || !comRes.success || !comRes.assets || comRes.assets.length != 1 || !comRes.assetVersions || comRes.assetVersions.length != 1) {
            // LOG.info(`AssetStorageAdapter.ingestStreamOrFile commit asset: ${comRes ? comRes.error : ''}. (ISI: ${H.Helpers.JSONStringify(ISI)} | Result: ${H.Helpers.JSONStringify(comRes)})`,LOG.LS.eDEBUG);
            const error: string = `Unable to commit asset: ${comRes ? comRes.error : ''}. (ISI: ${H.Helpers.JSONStringify(ISI)} | Result: ${H.Helpers.JSONStringify(comRes)})`;
            RK.logError(RK.LogSection.eSTR,'ingest stream or file failed',`Unable to commit asset: ${comRes ? comRes.error : ''}`,{ ...context, commitResult: comRes },'AssetStorageAdapter');
            return { success: false, error };
        }

        const ingestAssetInput: IngestAssetInput = {
            asset: comRes.assets[0],
            assetVersion: comRes.assetVersions[0],
            allowZipCracking: ISI.allowZipCracking,
            SOBased: ISI.SOBased,
            idSystemObject: null,
            opInfo,
            Comment: ISI.Comment,
            doNotSendIngestionEvent: ISI.doNotSendIngestionEvent,
            doNotUpdateParentVersion: ISI.doNotUpdateParentVersion
        };
        const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestAsset(ingestAssetInput);
        RK.logInfo(RK.LogSection.eSTR,'ingest stream or file success',undefined,{ ...context, numAssets: IAR.assets?.length ?? 0, numAssetVersions: IAR.assetVersions?.length ?? 0 },'AssetStorageAdapter');
        return IAR;
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
                    error: `Unable to update Asset.FileName ${JSON.stringify(asset, H.Helpers.saferStringify)}`,
                    asset,
                    assetVersion: null
                };
        }

        RK.logDebug(RK.LogSection.eSTR,'rename asset success',undefined,{ asset, fileNameNew },'AssetStorageAdapter');
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
            /* istanbul ignore next */
            if (!await DBAPI.SystemObject.retireSystemObject(asset)) /* istanbul ignore next */
                return {
                    success: false,
                    error: `Unable to mark SystemObject as retired for Asset ${JSON.stringify(asset, H.Helpers.saferStringify)}`,
                    asset,
                    assetVersion: null
                };
        }

        RK.logDebug(RK.LogSection.eSTR,'hide asset success','',{ asset },'AssetStorageAdapter');
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
            /* istanbul ignore next */
            if (!await DBAPI.SystemObject.reinstateSystemObject(asset)) /* istanbul ignore next */
                return {
                    success: false,
                    error: `Unable to mark SystemObject as not retired for Asset ${JSON.stringify(asset, H.Helpers.saferStringify)}`,
                    asset,
                    assetVersion
                };
        }

        RK.logDebug(RK.LogSection.eSTR,'reinstate asset success','',{ asset, assetVersion },'AssetStorageAdapter');
        return ASR;
    }

    static async crackAssetByAssetVersionID(idAssetVersion: number): Promise<CrackAssetResult> {
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
        if (!assetVersion) {
            const error: string = `AssetStorageAdapter.crackAssetByAssetVersionID unable to compute AssetVersion for idAssetVersion ${idAssetVersion}`;
            RK.logError(RK.LogSection.eSTR,'crack asset by version id failed','unable to compute AssetVersion for idAssetVersion',{ idAssetVersion },'AssetStorageAdapter');
            return { success: false, error, zip: null, asset: null, isBagit: false };
        }
        return this.crackAsset(assetVersion);
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
            const error: string = `unable to compute asset for AssetVersion ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`;

            return { success: false, error, zip: null, asset: null, isBagit: false };
        }

        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            const error: string = 'Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            RK.logError(RK.LogSection.eSTR,'creack asset failed',error,{ assetVersion },'AssetStorageAdapter');
            return { success: false, error, zip: null, asset: null, isBagit: false };
        }

        const result: CrackAssetResult = await AssetStorageAdapter.crackAssetWorker(storage, asset, assetVersion);
        if(result.success===false)
            RK.logError(RK.LogSection.eSTR,'crack asset failed',result.error,{ asset },'AssetStorageAdapter');
        else
            RK.logDebug(RK.LogSection.eSTR,'crack asset success',undefined,{ asset },'AssetStorageAdapter');

        return result;
    }

    /** Computes storage key/ingested, then creates either a read stream or a filename for use in accessing the file. */
    private static async assetFileOrStream(storage: IStorage, asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion): Promise<AssetFileOrStreamResult> {
        const { storageKey, ingested, error } = AssetStorageAdapter.computeStorageKeyAndIngested(asset, assetVersion); /* istanbul ignore next */
        if (!storageKey) {
            RK.logError(RK.LogSection.eSTR,'create asset stream or file failed',`cannot compute storage key: ${error}`,{ asset, assetVersion },'AssetStorageAdapter');
            return { success: false, error };
        }

        if (!ingested) {  // non-ingested content is staged locally
            RK.logInfo(RK.LogSection.eSTR,'create asset stream or file success','staged locally',{ fileName: await storage.stagingFileName(storageKey) },'AssetStorageAdapter');
            return { success: true, fileName: await storage.stagingFileName(storageKey) };
        }

        // ingested content lives on remote storage; we'll need to stream it back to the server for processing
        const readStreamInput: STORE.ReadStreamInput = {
            storageKey,
            fileName: assetVersion.FileName,
            version: assetVersion.Version,
            staging: !assetVersion.Ingested
        };

        const RSR: STORE.ReadStreamResult = await storage.readStream(readStreamInput); /* istanbul ignore next */
        if (!RSR.success|| !RSR.readStream) {
            RK.logError(RK.LogSection.eSTR,'create asset stream or file failed',`cannot compute storage key: ${RSR.error}`,{ readStreamInput },'AssetStorageAdapter');
            return { success: true, error: RSR.error };
        }

        RK.logDebug(RK.LogSection.eSTR,'create asset stream or file success',undefined,{ storageKey },'AssetStorageAdapter');
        return { success: true, stream: RSR.readStream, fileName: assetVersion.FileName };
    }

    private static async crackAssetWorker(storage: IStorage, asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion): Promise<CrackAssetResult> {
        const AFOSR: AssetFileOrStreamResult = await AssetStorageAdapter.assetFileOrStream(storage, asset, assetVersion);
        if (!AFOSR.success) {
            RK.logError(RK.LogSection.eSTR,'crack asset worker failed',AFOSR.error,{ asset, assetVersion },'AssetStorageAdapter');
            return { success: false, error: AFOSR.error, zip: null, asset: null, isBagit: false };
        }

        const isZipFilename: boolean = (path.extname(assetVersion.FileName).toLowerCase() === '.zip');
        const isBulkIngest: boolean = assetVersion.BulkIngest || (await asset.assetType() == COMMON.eVocabularyID.eAssetAssetTypeBulkIngestion);

        let reader: IZip | null = null;
        try {
            if (AFOSR.stream) { // ingested content
                reader = (isBulkIngest) /* istanbul ignore next */ // We don't ingest bulk ingest files as is -- they end up getting cracked apart, so we're unlikely to hit this branch of code
                    ? new BagitReader({ zipFileName: null, zipStream: AFOSR.stream, directory: null, validate: true, validateContent: false })
                    : new ZipStream(AFOSR.stream);
            } else if (AFOSR.fileName) { // non-ingested content is staged locally
                reader = (isBulkIngest)
                    ? new BagitReader({ zipFileName: AFOSR.fileName, zipStream: null, directory: null, validate: true, validateContent: false })
                    : new ZipFile(AFOSR.fileName);
            } else {
                RK.logError(RK.LogSection.eSTR,'crack asset worker failed','unable to determine filename or stream',{ asset, assetVersion },'AssetStorageAdapter');
                return { success: false, error: 'unable to determine filename or stream', zip: null, asset: null, isBagit: false };
            }

            const ioResults: IOResults = await reader.load(); /* istanbul ignore next */
            if (!ioResults.success) {
                await reader.close();
                if (isBulkIngest || isZipFilename)
                    RK.logError(RK.LogSection.eSTR,'crack asset worker failed',`unable to load reader: ${ioResults.error}`,{ asset, assetVersion, isBulkIngest, isZipFile: isZipFilename },'AssetStorageAdapter');
                return { success: false, error: ioResults.error, zip: null, asset: null, isBagit: false };
            }
        } catch (error) /* istanbul ignore next */ {
            if (reader)
                await reader.close();

            RK.logError(RK.LogSection.eSTR,'crack asset worker failed',H.Helpers.getErrorString(error),{ asset, assetVersion },'AssetStorageAdapter');
            return { success: false, error: `${JSON.stringify(error, H.Helpers.saferStringify)}`, zip: null, asset: null, isBagit: false };
        }

        RK.logDebug(RK.LogSection.eSTR,'crack asset worker success',undefined,{ asset, assetVersion, isBulkIngest, isZipFile: isZipFilename },'AssetStorageAdapter');
        return { success: true, zip: reader, asset, isBagit: isBulkIngest };
    }

    static async getAssetVersionContents(assetVersion: DBAPI.AssetVersion): Promise<AssetVersionContent> {
        const retValue = {
            idAssetVersion: assetVersion.idAssetVersion,
            folders: new Array<string>(),
            all: new Array<string>()
        };

        const ASC: CrackAssetResult = await AssetStorageAdapter.crackAsset(assetVersion); /* istanbul ignore next */

        if (!ASC.zip) {     // if our file is not a zip, just return it
            retValue.all.push(assetVersion.FileName);
            return retValue;
        }
        if (!ASC.success) {   // if cracking the asset fails, then we found nothing
            RK.logError(RK.LogSection.eSTR,'get asset version contents failed','found nothing in asset',{ assetVersion },'AssetStorageAdapter');
            return retValue;
        }

        // for the time being, we handle bagit content differently than zip content
        // bagits (isBulkIngest) use getJustFiles() to report the contents of the data folder,
        //    and getJustDirectories() to report the directories in the data folder.
        //    Both are filtered using assetVersion.FilePath when BulkIngest is non-empty
        // zips give us everything
        if (ASC.isBagit) {
            const filter: string | null = (assetVersion.BulkIngest) ? assetVersion.FilePath : /* istanbul ignore next */ null;
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
            }
        }

        await ASC.zip.close();
        RK.logDebug(RK.LogSection.eSTR,'get asset version contents success',undefined,{ assetVersion },'AssetStorageAdapter');
        return retValue;
    }

    /** This method removes staged files from our storage system (i.e. uploaded but not ingested). If successful,
     * it then retires the asset version, clears the StorageKeyStaging, and retires the asset, when all versions are retired */
    static async discardAssetVersion(assetVersion: DBAPI.AssetVersion): Promise<AssetStorageResult> {

        RK.logDebug(RK.LogSection.eSTR,'discard AssetVersion',undefined,{ assetVersion },'AssetStorageAdapter');

        // only works for staged versions -- fail if not staged
        if (assetVersion.Ingested) {
            RK.logError(RK.LogSection.eSTR,'discard AssetVersion failed','ingested assets cannot be discarded', { assetVersion },'AssetStorageAdapter');
            return { asset: null, assetVersion, success: false, error: 'Ingested asset versions cannot be discarded' };
        }

        // this should be true, but a storage failure may result in a cleared StorageKeyStaging for a non-ingested asset version
        if (assetVersion.StorageKeyStaging) {
            // discard staged asset
            // Bulk Ingest and Zip files may be referenced by multiple asset versions. To avoid removing the file referenced by these,
            // we only perform the discard if this is the final non-retired reference
            const storageKeyStagingCount: number | null = await DBAPI.AssetVersion.countStorageKeyStaging(assetVersion.StorageKeyStaging, false, false);
            if (storageKeyStagingCount === null) {
                const error: string = `call to AssetVersion.countStorageKeyStaging(${assetVersion.StorageKeyStaging}, false, false) failed`;
                RK.logError(RK.LogSection.eSTR,'discard AssetVersion failed','cannout count staging storage key', { assetVersion },'AssetStorageAdapter');
                return { asset: null, assetVersion, success: false, error };
            }
            if (storageKeyStagingCount === 1) {
                // fetch storage interface
                const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
                if (!storage) {
                    RK.logError(RK.LogSection.eSTR,'discard AssetVersion failed','unable to retrieve Storage Implementation from StorageFactory', { assetVersion },'AssetStorageAdapter');
                    return { asset: null, assetVersion, success: false, error: 'Unable to retrieve Storage Implementation from StorageFactory.getInstace()' };
                }

                const DWSR: STORE.DiscardWriteStreamResult = await storage.discardWriteStream({ storageKey: assetVersion.StorageKeyStaging });
                if (!DWSR.success) {
                    RK.logError(RK.LogSection.eSTR,'discard AssetVersion failed',`cannot discard write stream: ${DWSR.error}`, { assetVersion },'AssetStorageAdapter');
                    return { asset: null, assetVersion, success: false, error: `${DWSR.error}` };
                }
            } else
                RK.logDebug(RK.LogSection.eSTR,'discard AssetVersion','skipped IStorage.discardWriteStream as asset reference count !== 1',{ assetVersion, storageKeyStagingCount },'AssetStorageAdapter');
        } else
            RK.logError(RK.LogSection.eSTR,'discard AssetVersion failed','was not ingested. no StorageKeyStaging', { assetVersion },'AssetStorageAdapter');

        // retire assetVersion
        if (!await DBAPI.SystemObject.retireSystemObject(assetVersion)) { /* istanbul ignore next */
            RK.logError(RK.LogSection.eSTR,'discard AssetVersion failed','retire sdystem object failed', { assetVersion },'AssetStorageAdapter');
            return { asset: null, assetVersion: null, success: false, error: 'SystemObject.retireSystemObject failed' };
        }

        // clear StorageKeyStaging from this retired asset version
        assetVersion.StorageKeyStaging = '';
        // assetVersion.Ingested = true;
        if (!await assetVersion.update()) /* istanbul ignore next */ {
            const error: string = `unable to clear staging storage key from AssetVersion ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`;
            RK.logError(RK.LogSection.eSTR,'discard AssetVersion failed','unable to clear staging storage key from AssetVersion', { assetVersion },'AssetStorageAdapter');
            return { asset: null, assetVersion: null, success: false, error };
        }

        // Retire the asset associated with this asset version ... if and only if all versions are also retired
        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
        if (!asset)
            return { asset: null, assetVersion: null, success: false, error: `Unable to fetch asset ${assetVersion.idAsset}` };

        const retireRes: H.IOResults = await AssetStorageAdapter.retireAssetIfAllVersionsAreRetired(asset);
        return (retireRes.success)
            ? { asset: null, assetVersion: null, success: true }
            : { asset: null, assetVersion: null, success: false, error: retireRes.error };
    }

    private static async actOnAssetWorker(asset: DBAPI.Asset, opInfo: STORE.OperationInfo,
        renameAssetInput: STORE.RenameAssetInput | null,
        hideAssetInput: STORE.HideAssetInput | null,
        reinstateAssetInput: STORE.ReinstateAssetInput | null): Promise<AssetStorageResult> {

        /* istanbul ignore next */
        if (!asset.StorageKey) {
            const error: string = `Asset ${JSON.stringify(asset, H.Helpers.saferStringify)} has null storageKey`;
            RK.logError(RK.LogSection.eSTR,'act on asset worker failed','has NULL storage key', { asset },'AssetStorageAdapter');
            return { success: false, error, asset, assetVersion: null };
        }

        const retValue: AssetStorageResult = {
            asset,
            assetVersion: null,
            success: false,
        };
        let fileNameNew: string = '';

        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            retValue.success = false;
            retValue.error = 'Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            RK.logError(RK.LogSection.eSTR,'act on asset worker failed','unable to retrieve Storage Implementation from StorageFactory', { asset },'AssetStorageAdapter');
            return retValue;
        }

        // Read most recent AssetVersion
        const assetVersionOld: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(asset.idAsset); /* istanbul ignore next */
        if (!assetVersionOld) {
            retValue.success = false;
            retValue.error = `Unable to fetch latest AssetVersion for ${asset}`;
            RK.logError(RK.LogSection.eSTR,'act on asset worker failed','unable to fetch latest AssetVersion', { asset },'AssetStorageAdapter');
            return retValue;
        }

        if (renameAssetInput) {
            const renameAssetResult = await storage.renameAsset(renameAssetInput); /* istanbul ignore next */
            if (!renameAssetResult.success) {
                retValue.success = false;
                retValue.error = renameAssetResult.error;
                RK.logError(RK.LogSection.eSTR,'act on asset worker failed','cannot rename asset', { asset },'AssetStorageAdapter');
                return retValue;
            }
            fileNameNew = renameAssetInput.fileNameNew;
        } else if (hideAssetInput) {
            const hideAssetResult = await storage.hideAsset(hideAssetInput); /* istanbul ignore next */
            if (!hideAssetResult.success) {
                retValue.success = false;
                retValue.error = hideAssetResult.error;
                RK.logError(RK.LogSection.eSTR,'act on asset worker failed','cannot hide asset', { asset },'AssetStorageAdapter');
                return retValue;
            }
        } else /* istanbul ignore next */ if (reinstateAssetInput) {
            const reinstateAssetResult = await storage.reinstateAsset(reinstateAssetInput);
            if (!reinstateAssetResult.success) {
                retValue.success = false;
                retValue.error = reinstateAssetResult.error;
                RK.logError(RK.LogSection.eSTR,'act on asset worker failed','cannot reinstate asset', { asset },'AssetStorageAdapter');
                return retValue;
            }
        }

        // Create new AssetVersion
        const assetVersion: DBAPI.AssetVersion = new DBAPI.AssetVersion({
            idAsset: asset.idAsset,
            Version: 0, /* ignored */
            FileName: fileNameNew ? fileNameNew : assetVersionOld.FileName,
            idUserCreator: opInfo.idUser,
            DateCreated: new Date(),
            StorageHash: assetVersionOld.StorageHash,
            StorageSize: assetVersionOld.StorageSize,
            StorageKeyStaging: assetVersionOld.StorageKeyStaging,
            Ingested: assetVersionOld.Ingested,
            BulkIngest: assetVersionOld.BulkIngest,
            idSOAttachment: assetVersionOld.idSOAttachment,
            FilePath: assetVersionOld.FilePath,
            Comment: opInfo.message,
            idAssetVersion: 0
        });

        /* istanbul ignore next */
        if (!await assetVersion.create()) {
            retValue.success = false;
            retValue.error = `Unable to create AssetVersion ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`;
            RK.logError(RK.LogSection.eSTR,'act on asset worker failed','unable to create AssetVersion', { asset },'AssetStorageAdapter');
            return retValue;
        }
        retValue.asset = asset;
        retValue.assetVersion = assetVersion;
        retValue.success = true;
        return retValue;
    }

    static async computeOperationInfo(user: DBAPI.User, message?: string | undefined): Promise<STORE.OperationInfo | null>;
    static async computeOperationInfo(idUser: number, message?: string | undefined): Promise<STORE.OperationInfo | null>;
    static async computeOperationInfo(idUser: number | DBAPI.User, message?: string | undefined): Promise<STORE.OperationInfo | null> {
        const user: DBAPI.User | undefined = idUser instanceof DBAPI.User ? idUser : await CACHE.UserCache.getUser(idUser);
        if (!user)
            return null;
        return {
            message: message ?? '',
            idUser: user.idUser,
            userEmailAddress: user.EmailAddress,
            userName: user.Name
        };
    }

    private static computeStorageKeyAndIngested(asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion): { storageKey: string | null, ingested: boolean | null, error: string } {
        let storageKey: string | null = null;
        const ingested: boolean | null = assetVersion.Ingested;
        let error: string = '';
        if (ingested) { /* istanbul ignore next */
            if (!asset.StorageKey) {
                error = `Asset ${JSON.stringify(asset, H.Helpers.saferStringify)} has null storageKey`;
                RK.logError(RK.LogSection.eSTR,'compute storage key failed','has NULL storage key', { asset, assetVersion },'AssetStorageAdapter');
                return { storageKey, ingested, error };
            }
            storageKey = asset.StorageKey;
        } else
            storageKey = assetVersion.StorageKeyStaging;
        return { storageKey, ingested, error };
    }

    /**
     * Detect zip files inside a Scene package that correspond to
     * Voyager-generated download bundles (e.g. full-res OBJ, GLTF, etc).
     *
     * NOTE: This list is intentionally kept in sync with the suffixes
     * validated in JobCookSIGenerateDownloads.verifyIncomingCookData.
     */
    private static isSceneDownloadZipFile(unzippedFileName: string): boolean {
        const lower: string = unzippedFileName.toLowerCase();

        // Keep these in sync with JobCookSIGenerateDownloads.verifyIncomingCookData
        const downloadZipSuffixes: string[] = [
            '-full_resolution-obj_std.zip',
            '-150k-4096-gltf_std.zip',
            '-150k-4096-obj_std.zip',
        ];

        return downloadZipSuffixes.some(suffix => lower.endsWith(suffix));
    }
}