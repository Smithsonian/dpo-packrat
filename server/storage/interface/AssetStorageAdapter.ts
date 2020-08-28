/**
 The AssetStorageAdapter provides a DBAPI-based bridge to the storage interface
 It Allows the storage system to know nothing about the DB
 Interfaces like:  ReadAssetVersion(Asset, AssetVersion)
 */

import * as STORE from '../interface';
import * as DBAPI from '../../db';
import * as LOG from '../../utils/logger';
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
        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            const error: string = 'AssetStorageAdapter.readAsset: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            LOG.logger.error(error);
            return {
                readStream: null,
                storageHash: null,
                success: false,
                error
            };
        }

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
        FileName: string, FilePath: string, idAssetGroup: number | null, idVAssetType: number,
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

        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            retValue.success = false;
            retValue.error = 'AssetStorageAdapter.commitNewAssetVersion: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            LOG.logger.error(retValue.error);
            return retValue;
        }

        const resStorage = await storage.commitWriteStream(commitWriteStreamInput);
        if (!resStorage.success) {
            retValue.success = false;
            retValue.error = resStorage.error;
            LOG.logger.error(retValue.error);
            return retValue;
        }

        // Create Asset if necessary
        if (asset.idAsset == 0 && !await asset.create()) /* istanbul ignore next */ {
            retValue.success = false;
            retValue.error = `AssetStorageAdapter.commitNewAssetVersion: Unable to create Asset ${JSON.stringify(asset)}`;
            LOG.logger.error(retValue.error);
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

        if (!await assetVersion.create()) /* istanbul ignore next */ {
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

    static async ingestAsset(storageKeyStaged: string, asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion,
        SOBased: DBAPI.SystemObjectBased, opInfo: STORE.OperationInfo): Promise<AssetStorageResult> {
        const SO: DBAPI.SystemObject | null = await SOBased.fetchSystemObject();
        if (!SO) {
            const error: string = `Unable to fetch SystemObject for ${SO}`;
            return {
                asset,
                assetVersion,
                success: false,
                error
            };
            LOG.logger.error(error);
        }
        return await AssetStorageAdapter.ingestAssetForSystemObjectID(storageKeyStaged, asset, assetVersion, SO.idSystemObject, opInfo);
    }

    static async ingestAssetForSystemObjectID(storageKeyStaged: string, asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion,
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

        const storageKeyResults = await storage.computeStorageKey(asset.idAsset.toString());
        if (!storageKeyResults.success) {
            retValue.success = false;
            retValue.error = storageKeyResults.error;
            LOG.logger.error(retValue.error);
            return retValue;
        }

        const metadata: DBAPI.ObjectAncestry = new DBAPI.ObjectAncestry(idSystemObject);
        if (!await metadata.fetch()) {
            retValue.success = false;
            retValue.error = `AssetStorageAdapter.ingestAsset: Update to retrieve object ancestry for system object ${idSystemObject}`;
            LOG.logger.error(retValue.error);
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
            LOG.logger.error(retValue.error);
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
                LOG.logger.error(retValue.error);
                return retValue;
            }
        }

        assetVersion.Ingested = true;
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
            storageKey: asset.StorageKey,
            fileNameOld: asset.FileName,
            fileNameNew,
            opInfo
        };

        const ASR = await this.actOnAssetWorker(asset, opInfo, renameAssetInput, null, null);
        if (ASR.success) {
            // TODO: handle later failures by rolling back storage system change
            asset.FileName = fileNameNew;
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
            storageKey: asset.StorageKey,
            fileName: asset.FileName,
            opInfo
        };
        const ASR = await this.actOnAssetWorker(asset, opInfo, null, hideAssetInput, null);

        if (ASR.success) {
            // TODO: handle later failures by rolling back storage system change
            // Mark this asset as retired
            const SO: DBAPI.SystemObject | null = await asset.fetchSystemObject();
            if (SO == null)
                return {
                    success: false,
                    error: `AssetStorageAdapter.hideAsset: Unable to retrieve SystemObject for Asset ${JSON.stringify(asset)}`,
                    asset,
                    assetVersion: null
                };

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
            storageKey: asset.StorageKey,
            fileName: asset.FileName,
            version: assetVersion ? assetVersion.Version : -1, // -1 means the most recent version
            opInfo
        };
        const ASR = await this.actOnAssetWorker(asset, opInfo, null, null, reinstateAssetInput);

        if (ASR.success) {
            // TODO: handle later failures by rolling back storage system change
            // Mark this asset as not retired
            const SO: DBAPI.SystemObject | null = await asset.fetchSystemObject();
            if (SO == null)
                return {
                    success: false,
                    error: `AssetStorageAdapter.reinstateAsset: Unable to retrieve SystemObject for Asset ${JSON.stringify(asset)}`,
                    asset,
                    assetVersion
                };

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
        const retValue: AssetStorageResult = {
            asset,
            assetVersion: null,
            success: false,
            error: ''
        };

        const storage: IStorage | null = await StorageFactory.getInstance(); /* istanbul ignore next */
        if (!storage) {
            retValue.success = false;
            retValue.error = 'AssetStorageAdapter.actOnAssetWorker: Unable to retrieve Storage Implementation from StorageFactory.getInstace()';
            LOG.logger.error(retValue.error);
            return retValue;
        }

        // Read most recent AssetVersion
        const assetVersionOld: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(asset.idAsset);
        if (!assetVersionOld) {
            retValue.success = false;
            retValue.error = `AssetStorageAdapter.actOnAssetWorker: Unable to fetch latest AssetVersion for ${asset}`;
            LOG.logger.error(retValue.error);
            return retValue;
        }

        if (renameAssetInput) {
            const renameAssetResult = await storage.renameAsset(renameAssetInput);
            if (!renameAssetResult.success) {
                retValue.success = false;
                retValue.error = renameAssetResult.error;
                LOG.logger.error(retValue.error);
                return retValue;
            }
        } else if (hideAssetInput) {
            const hideAssetResult = await storage.hideAsset(hideAssetInput);
            if (!hideAssetResult.success) {
                retValue.success = false;
                retValue.error = hideAssetResult.error;
                LOG.logger.error(retValue.error);
                return retValue;
            }
        } else if (reinstateAssetInput) {
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
            idUserCreator: opInfo.idUser,
            DateCreated: new Date(),
            StorageChecksum: assetVersionOld.StorageChecksum,
            StorageSize: assetVersionOld.StorageSize,
            Ingested: assetVersionOld.Ingested,
            Version: 1, /* ignored */
            idAssetVersion: 0
        });

        if (!await assetVersion.create()) /* istanbul ignore next */ {
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
}