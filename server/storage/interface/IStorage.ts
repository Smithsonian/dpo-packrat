import { Readable, Writable } from 'stream';
import * as DBAPI from '../../db';

export type ReadStreamResult = {
    readStream: Readable | null,
    hash: string | null,
    success: boolean,
    error: string
};

export type WriteStreamResult = {
    writeStream: Writable | null,
    storageKey: string | null,
    success: boolean,
    error: string
};

export type WriteStreamCloseInput = {
    asset: DBAPI.Asset, // When asset.idAsset > 0, we are uploading a new version
    storageKey: string,
    idUserCreator: number,
    dateCreated: Date,
    storageHash: string | null,
    storageSize: number | null,
};

export type WriteStreamCloseResult = {
    storageKey: string | null,
    asset: DBAPI.Asset | null,
    assetVersion: DBAPI.AssetVersion | null,
    success: boolean,
    error: string
};

export type PromoteStagedFileResult = {
    success: boolean,
    error: string
};

export type HierarchyUpdatedResults = {
    success: boolean,
    error: string
};

export type ComputeStorageKeyResults = {
    storageKey: string;
    success: boolean,
    error: string
};

export interface IStorage {
    /**
     * Provides a Readable stream for accessing the bits associated with storageKey. Also provides the hash, which the client may use for validating streamed bits.
     * Client must dispose of this Readable stream properly.
     * @param storageKey Opaque storage identifier created by writeStream(), maintained by closeWriteStream(), and updated by promoteStagedAsset()
     */
    readStream(storageKey: string, version: number): Promise<ReadStreamResult>;

    /**
     * Provides a Writable stream used to stream data into the storage system.
     * Files are always streamed to a random location within the staging area.
     * writeStreamClose() is used to promote files into the repository from the staging area.
     * Returns a Writable stream and a StorageKey, which is the input to writeStreamClose().
     */
    writeStream(): Promise<WriteStreamResult>;

    /**
     * Informs the storage system that the client is done writing to the stream returned by writeStream().
     * Updates the database, creating an AssetVersion, and when needed, an Asset
     * If the asset already exists, the file is promoted into the repository.
     * @param writeStreamCloseInput Includes storage key, the opaque storage identifier created by writeStream(), maintained by closeWriteStream(), and updated by promoteStagedAsset().
     * Other information is needed to properly update database.
     */
    writeStreamClose(writeStreamCloseInput: WriteStreamCloseInput): Promise<WriteStreamCloseResult>;

    /**
     * Promotes a staged file into the repository.  This should be called after writeStreamClose(),
     * and after ingestion has completed (i.e. gathering of metadata that describes the file and
     * its relationship to the rest of the objects in the system)
     * @param asset Asset identifying staged file to promote
     * @param assetVersion AssetVersion identifying staged file to promote
     */
    promoteStagedAsset(asset: DBAPI.Asset, assetVersion: DBAPI.AssetVersion): Promise<PromoteStagedFileResult>;

    /**
     * Informs the storage system of the potential need to update metadata describing the asset
     * due to changes in an asset's object ancestrion (e.g. Units, Projects, Subjects, Items, etc)
     * @param storageKey Opaque storage identifier created by writeStream(), maintained by closeWriteStream(), and updated by promoteStagedAsset()
     */
    hierarchyUpdated(storageKey: string): Promise<HierarchyUpdatedResults>;

    /**
     * Validate hash stored for indicated asset version
     * @param storageKey Opaque storage identifier created by writeStream(), maintained by closeWriteStream(), and updated by promoteStagedAsset()
     */
    validateHash(storageKey: string): Promise<boolean>;

    /**
     * Computes a storage key representing an asset
     * @param uniqueID This will be Asset.idAsset, transformed into a string
     */
    computeStorageKey(uniqueID: string): Promise<ComputeStorageKeyResults>;
}
