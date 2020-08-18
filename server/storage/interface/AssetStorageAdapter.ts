/**
 The AssetStorageAdapter provides a DBAPI-based bridge to the storage interface
 It Allows the storage system to know nothing about the DB
 Interfaces like:  ReadAssetVersion(Asset, AssetVersion)
 */

// import * as fs from 'fs';
import * as STORE from '../interface';
import * as DBAPI from '../../db';
// import * as LOG from '../../utils/logger';
// import * as H from '../../utils/helpers';
import { StorageFactory } from './StorageFactory';
import { IStorage } from './IStorage';

export type CommitAssetResult = {
    asset: DBAPI.Asset | null,
    assetVersion: DBAPI.AssetVersion | null,
    success: boolean,
    error: string
};

export type IngestAssetResult = {
    success: boolean,
    error: string
};

export class AssetStorageAdapter {
    static async readAsset(asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion): Promise<STORE.ReadStreamResult> {
        const storage: IStorage | null = await StorageFactory.getInstance();
        if (!storage)
            return {
                readStream: null,
                storageHash: null,
                success: false,
                error: 'AssetStorageAdapter.readAsset: Unable to retrieve Storage Implementation from StorageFactory.getInstace()'
            };

        const readStreamInput: STORE.ReadStreamInput = {
            storageKey: asset.StorageKey,
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
    static async commitNewAsset(commitWriteStreamInput: STORE.CommitWriteStreamInput,
        FileName: string, FilePath: string, idAssetGroup: number, idVAssetType: number,
        idUserCreator: number, DateCreated: Date):
        Promise<CommitAssetResult> {

        const asset: DBAPI.Asset = new DBAPI.Asset({
            FileName,
            FilePath,
            idAssetGroup,
            idVAssetType,
            idSystemObject: null,
            StorageKey: commitWriteStreamInput.storageKey,
            idAsset: 0
        });

        return await AssetStorageAdapter.commitNewAssetVersion(commitWriteStreamInput, asset, idUserCreator, DateCreated);
    }

    /**
     * Commits Storage WriteStream
     * Creates and persists AssetVersion (and Asset if Asset.idAsset is 0)
     */
    static async commitNewAssetVersion(commitWriteStreamInput: STORE.CommitWriteStreamInput,
        asset: DBAPI.Asset, idUserCreator: number, DateCreated: Date):
        Promise<CommitAssetResult> {
        const retValue: CommitAssetResult = {
            asset: null,
            assetVersion: null,
            success: false,
            error: ''
        };

        const storage: IStorage | null = await StorageFactory.getInstance();
        if (!storage) {
            retValue.success = false;
            retValue.error = 'AssetStorageAdapter.commitNewAssetVersion: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            return retValue;
        }

        const resStorage = await storage.commitWriteStream(commitWriteStreamInput);
        if (!resStorage.success) {
            retValue.success = false;
            retValue.error = resStorage.error;
            return retValue;
        }

        // Create Asset if necessary
        if (asset.idAsset == 0 && !await asset.create()) {
            retValue.success = false;
            retValue.error = `AssetStorageAdapter.commitNewAssetVersion: Unable to create Asset ${JSON.stringify(asset)}`;
            return retValue;
        }

        const assetVersion: DBAPI.AssetVersion = new DBAPI.AssetVersion({
            idAsset: asset.idAsset,
            idUserCreator,
            DateCreated,
            StorageChecksum: resStorage.storageHash ? resStorage.storageHash : '',
            StorageSize: resStorage.storageSize ? resStorage.storageSize : 0,
            Ingested: false,
            Version: 1, /* ignored */
            idAssetVersion: 0
        });

        if (!await assetVersion.create()) {
            retValue.success = false;
            retValue.error = `AssetStorageAdapter.commitNewAssetVersion: Unable to create AssetVersion ${JSON.stringify(assetVersion)}`;
            return retValue;
        }
        retValue.asset = asset;
        retValue.assetVersion = assetVersion;
        retValue.success = true;
        return retValue;
    }

    static async ingestAsset(storageKeyStaged: string, asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion,
        idSystemObject: number): Promise<IngestAssetResult> {
        // Call IStorage.promote
        // Update asset.StorageKey, if needed
        // Update assetVersion.Ingested to true
        const retValue: IngestAssetResult = {
            success: false,
            error: ''
        };

        const storage: IStorage | null = await StorageFactory.getInstance();
        if (!storage) {
            retValue.success = false;
            retValue.error = 'AssetStorageAdapter.ingestAsset: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            return retValue;
        }

        const storageKeyResults = await storage.computeStorageKey(asset.idAsset.toString());
        if (!storageKeyResults.success) {
            retValue.success = false;
            retValue.error = storageKeyResults.error;
            return retValue;
        }

        const metadata: DBAPI.ObjectAncestry = new DBAPI.ObjectAncestry(idSystemObject);
        if (!await metadata.fetch()) {
            retValue.success = false;
            retValue.error = `AssetStorageAdapter.ingestAsset: Update to retrieve object ancestry for system object ${idSystemObject}`;
            return retValue;
        }

        const promoteStagedAssetInput: STORE.PromoteStagedAssetInput = {
            storageKeyStaged,
            storageKeyFinal: storageKeyResults.storageKey,
            fileName: asset.FileName,
            version: assetVersion.Version,
            metadata
        };

        const resStorage = await storage.promoteStagedAsset(promoteStagedAssetInput);
        if (!resStorage.success) {
            retValue.success = false;
            retValue.error = resStorage.error;
            return retValue;
        }

        // Update Asset if new information is being provided here
        // This should only be happening the first time we ingest
        if (asset.idSystemObject != idSystemObject ||
            asset.StorageKey != storageKeyResults.storageKey) {
            asset.idSystemObject = idSystemObject;
            asset.StorageKey = storageKeyResults.storageKey;
            if (!await asset.update()) {
                retValue.success = false;
                retValue.error = `AssetStorageAdapter.ingestAsset: Update to update Asset ${JSON.stringify(asset)}`;
                return retValue;
            }
        }

        assetVersion.Ingested = true;
        if (!await assetVersion.update()) {
            retValue.success = false;
            retValue.error = `AssetStorageAdapter.ingestAsset: Update to update AssetVersion ${JSON.stringify(assetVersion)}`;
            return retValue;
        }

        return retValue;
    }
}