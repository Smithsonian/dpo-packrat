/* eslint-disable @typescript-eslint/no-explicit-any */
export type OperationInfo = {
    message: string,
    idUser: number,
    userEmailAddress: string,
    userName: string
};

export type ReadStreamInput = {
    storageKey: string,
    fileName: string,
    version: number,
    staging: boolean
};

export type ReadStreamResult = {
    readStream: NodeJS.ReadableStream | null,
    storageHash: string | null,
    success: boolean,
    error: string
};

export type WriteStreamResult = {
    writeStream: NodeJS.WritableStream | null,
    storageKey: string | null,
    success: boolean,
    error: string
};

export type CommitWriteStreamInput = {
    storageKey: string,
    storageHash: string | null,
};

export type CommitWriteStreamResult = {
    storageHash: string | null,
    storageSize: number | null,
    success: boolean,
    error: string
};

export type DiscardWriteStreamInput = {
    storageKey: string,
};

export type DiscardWriteStreamResult = {
    success: boolean,
    error: string
};

export type PromoteStagedAssetInput = {
    storageKeyStaged: string,
    storageKeyFinal: string,
    fileName: string,
    metadata: any,
    opInfo: OperationInfo
};

export type PromoteStagedAssetResult = {
    success: boolean,
    error: string
};

export type RenameAssetInput = {
    storageKey: string,
    fileNameOld: string,
    fileNameNew: string,
    opInfo: OperationInfo
};

export type RenameAssetResult = {
    success: boolean,
    error: string
};

export type HideAssetInput = {
    storageKey: string,
    fileName: string,
    opInfo: OperationInfo
};

export type HideAssetResult = {
    success: boolean,
    error: string
};

export type ReinstateAssetInput = {
    storageKey: string,
    fileName: string,
    version: number,
    opInfo: OperationInfo
};

export type ReinstateAssetResult = {
    success: boolean,
    error: string
};

export type UpdateMetadataInput = {
    storageKey: string,
    metadata: any,
    opInfo: OperationInfo
};

export type UpdateMetadataResult = {
    success: boolean,
    error: string
};

export type ComputeStorageKeyResult = {
    storageKey: string;
    success: boolean,
    error: string
};

export type ValidateAssetResult = {
    success: boolean,
    error: string
};

export interface IStorage {
    /**
     * Provides a Readable stream for accessing the bits associated with storageKey.
     * Also provides the hash, which the client may use for validating streamed bits.
     * Client must dispose of this Readable stream properly.
     * @param readStreamInput Contains storageKey, Opaque storage identifier created by writeStream(), maintained by closeWriteStream(),
     * and updated by promoteStagedAsset(), as well as fileName, version, and staging indicator.
     */
    readStream(readStreamInput: ReadStreamInput): Promise<ReadStreamResult>;

    /** Provides access to staged files by filename */
    stagingFileName(storageKey: string): Promise<string>;

    /**
     * Provides a Writable stream used to stream data into the storage system.
     * Files are always streamed to a random location within the "staging" area.
     * commitWriteStream() is used to signal completion of the upload to staging.
     * promoteStagedAsset() is used to promote files into the repository from the staging area.
     * Returns a Writable stream and a StorageKey, which is the input to commitWriteStream()
     * and promoteStagedAsset().
     */
    writeStream(fileName: string): Promise<WriteStreamResult>;

    /**
     * Informs the storage system that the client is done writing to the stream returned by writeStream().
     * @param commitWriteStreamInput Includes storage key, the opaque storage identifier created by writeStream(),
     * maintained by closeWriteStream(), and updated by promoteStagedAsset().
     */
    commitWriteStream(commitWriteStreamInput: CommitWriteStreamInput): Promise<CommitWriteStreamResult>;

    /**
     * Informs the storage system that the client is discarding the streamed input, and the storage system should clean it up.
     * @param discardWriteStreamInput Includes storage key, the opaque storage identifier created by writeStream(),
     * maintained by closeWriteStream(), and updated by promoteStagedAsset().
     */
    discardWriteStream(discardWriteStreamInput: DiscardWriteStreamInput): Promise<DiscardWriteStreamResult>;

    /**
     * Promotes a staged file into the repository.  This should be called after commitWriteStream(),
     * and after ingestion has completed (i.e. gathering of metadata that describes the file and
     * its relationship to the rest of the objects in the system)
     */
    promoteStagedAsset(promoteStagedAssetInput: PromoteStagedAssetInput): Promise<PromoteStagedAssetResult>;

    /**
     * Renames the specified asset
     */
    renameAsset(renameAssetInput: RenameAssetInput): Promise<RenameAssetResult>;

    /**
     * Hides the specified asset
     */
    hideAsset(hideAssetInput: HideAssetInput): Promise<HideAssetResult>;

    /**
     * Reinstates the specified asset; pass in -1 for version to reinstate to most recent version
     */
    reinstateAsset(reinstateAssetInput: ReinstateAssetInput): Promise<ReinstateAssetResult>;

    /**
     * Informs the storage system of the potential need to update metadata describing the asset
     * due to changes in an asset's object ancestrion (e.g. Units, Projects, Subjects, Items, etc)
     * @param storageKey Opaque storage identifier created by writeStream(), maintained by closeWriteStream(), and updated by promoteStagedAsset()
     */
    updateMetadata(updateMetadataInput: UpdateMetadataInput): Promise<UpdateMetadataResult>;

    /**
     * Validate hash stored for asset
     * @param storageKey Opaque storage identifier created by writeStream(), maintained by closeWriteStream(), and updated by promoteStagedAsset()
     */
    validateAsset(storageKey: string): Promise<ValidateAssetResult>;

    /**
     * Computes a storage key representing an asset
     * @param uniqueID This will be Asset.idAsset, transformed into a string
     */
    computeStorageKey(uniqueID: string): Promise<ComputeStorageKeyResult>;
}
