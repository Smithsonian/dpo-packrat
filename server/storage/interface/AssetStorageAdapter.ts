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

export type AssetStorageResult = {
    asset: DBAPI.Asset | null,
    assetVersion: DBAPI.AssetVersion | null,
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
        Promise<AssetStorageResult> {

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
        Promise<AssetStorageResult> {
        const retValue: AssetStorageResult = {
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
            metadata,
            opInfo
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

    static async renameAsset(asset: DBAPI.Asset, fileNameNew: string, opInfo: STORE.OperationInfo): Promise<AssetStorageResult> {
        const renameAssetInput: STORE.RenameAssetInput = {
            storageKey: asset.StorageKey,
            fileNameOld: asset.FileName,
            fileNameNew,
            opInfo
        };
        return await this.actOnAssetWorker(asset, opInfo, renameAssetInput, null, null);
    }

    static async hideAsset(asset: DBAPI.Asset, opInfo: STORE.OperationInfo): Promise<AssetStorageResult> {
        const hideAssetInput: STORE.HideAssetInput = {
            storageKey: asset.StorageKey,
            fileName: asset.FileName,
            opInfo
        };
        return await this.actOnAssetWorker(asset, opInfo, null, hideAssetInput, null);
    }

    static async reinstateAsset(asset: DBAPI.Asset, opInfo: STORE.OperationInfo): Promise<AssetStorageResult> {
        const reinstateAssetInput: STORE.ReinstateAssetInput = {
            storageKey: asset.StorageKey,
            fileName: asset.FileName,
            opInfo
        };
        return await this.actOnAssetWorker(asset, opInfo, null, null, reinstateAssetInput);
    }

    private static async actOnAssetWorker(asset: DBAPI.Asset, opInfo: STORE.OperationInfo,
        renameAssetInput: STORE.RenameAssetInput | null,
        hideAssetInput: STORE.HideAssetInput | null,
        reinstateAssetInput: STORE.ReinstateAssetInput | null): Promise<AssetStorageResult> {
        const retValue: AssetStorageResult = {
            asset,
            assetVersion: null,
            success: false,
            error: ''
        };

        const storage: IStorage | null = await StorageFactory.getInstance();
        if (!storage) {
            retValue.success = false;
            retValue.error = 'AssetStorageAdapter.actOnAssetWorker: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            return retValue;
        }

        // Read most recent AssetVersion
        const assetVersionOld: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(asset.idAsset);
        if (!assetVersionOld) {
            retValue.success = false;
            retValue.error = `AssetStorageAdapter.actOnAssetWorker: Unable to fetch latest AssetVersion for ${asset}`;
            return retValue;
        }

        if (renameAssetInput) {
            const renameAssetResult = await storage.renameAsset(renameAssetInput);
            if (!renameAssetResult.success) {
                retValue.success = false;
                retValue.error = renameAssetResult.error;
                return retValue;
            }
        } else if (hideAssetInput) {
            const hideAssetResult = await storage.hideAsset(hideAssetInput);
            if (!hideAssetResult.success) {
                retValue.success = false;
                retValue.error = hideAssetResult.error;
                return retValue;
            }
        } else if (reinstateAssetInput) {
            const reinstateAssetResult = await storage.reinstateAsset(reinstateAssetInput);
            if (!reinstateAssetResult.success) {
                retValue.success = false;
                retValue.error = reinstateAssetResult.error;
                return retValue;
            }
        }

        // Create new AssetVersion
        const assetVersion: DBAPI.AssetVersion = new DBAPI.AssetVersion({
            idAsset: asset.idAsset,
            idUserCreator: opInfo.idUser,
            DateCreated: new Date(),
            StorageChecksum: assetVersionOld.StorageChecksum,
            StorageSize: assetVersionOld.StorageSize,
            Ingested: assetVersionOld.Ingested,
            Version: 1, /* ignored */
            idAssetVersion: 0
        });

        if (!await assetVersion.create()) {
            retValue.success = false;
            retValue.error = `AssetStorageAdapter.actOnAssetWorker: Unable to create AssetVersion ${JSON.stringify(assetVersion)}`;
            return retValue;
        }
        retValue.asset = asset;
        retValue.assetVersion = assetVersion;
        retValue.success = true;
        return retValue;
    }
}