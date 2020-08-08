import { Readable, Writable } from 'stream';
import * as DBAPI from '../../db';

export type ReadStreamResult = {
    readStream: Readable | null,
    hash: string | null,
    success: boolean,
    error: string
};

export type ReadStreamCloseResult = {
    success: boolean,
    error: string
};

export type WriteStreamInput = {
    asset: DBAPI.Asset, // When asset.idAsset > 0, we are uploading a new version
    dateCreated: Date,
    storageHash: string | null,
    storageSize: number | null,
    idUserCreator: number,
};

export type WriteStreamResult = {
    writeStream: Writable | null,
    storageKey: string | null,
    success: boolean,
    error: string
};

export type WriteStreamCloseResult = {
    storageKey: string | null,
    asset: DBAPI.Asset | null,
    assetVersion: DBAPI.AssetVersion | null,
    success: boolean,
    error: string
};

export type HierarchyUpdatedResults = {
    storageKeyInput: string,
    storageKeyOutput: string | null,
    asset: DBAPI.Asset | null,
    assetVersion: DBAPI.AssetVersion | null,
    success: boolean,
    error: string
};

export interface IStorage {
    /**
     * Provides a Readable stream for accessing the bits associated with storageKey. Also provides the hash, which the client may use for validating streamed bits.
     * @param storageKey Opaque storage identifier created by writeStream(), maintained by closeWriteStream(), and updated by placeAsset()
     */
    readStream(storageKey: string): Promise<ReadStreamResult>;

    /**
     * Informs the storage system that the client is done reading this stream
     * @param storageKey Opaque storage identifier created by writeStream(), maintained by closeWriteStream(), and updated by placeAsset()
     */
    readStreamClose(storageKey: string): Promise<ReadStreamCloseResult>;

    /**
     * Provides a Writable stream used to stream data into the storage system.
     * Files are always streamed to a staging area. writeStreamClose() is used to promote files into the repository from the staging area.
     * When called with writeStreamInput.asset.idAsset > 0, you are providing a new version of the specified asset.
     * Otherwise, you are creating a new asset.
     * Returned a StorageKey, which is the input to writeStreamClose().
     * @param writeStreamInput Information needed by the storage system to initialize writing
     */
    writeStream(writeStreamInput: WriteStreamInput): Promise<WriteStreamResult>;

    /**
     * Informs the storage system that the client is done writing to the stream returned by writeStream().
     * Promotes staged files into the repository.
     * Updates the database, creating an AssetVersion, and when needed, an Asset
     * @param storageKey Opaque storage identifier created by writeStream(), maintained by closeWriteStream(), and updated by placeAsset()
     */
    writeStreamClose(storageKey: string): Promise<WriteStreamCloseResult>;

    /**
     * Informs the storage system of the potential need to recompute a storage key
     * due to changes in an asset version's hieararchical objects (e.g. Unit Name, Project Name, Subject's primary identifier, Item.Name)
     * If a change is needed, update storage, and update the storage key in the AssetVersion in the database
     * @param storageKey Opaque storage identifier created by writeStream(), maintained by closeWriteStream(), and updated by placeAsset()
     */
    hierarchyUpdated(storageKey: string): Promise<HierarchyUpdatedResults>;

    /**
     * Validate hash stored for indicated asset version
     * @param storageKey Opaque storage identifier created by writeStream(), maintained by closeWriteStream(), and updated by placeAsset()
     */
    validateHash(storageKey: string): Promise<boolean>;
}
