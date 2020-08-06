interface IStorage {
    // readStream(storageKey)
    // writeStream(storageKey)
    // moveFile(storageKey, newFolder)
    validateHash(storageKey: string, hash: string): boolean;
}

export { IStorage as default };

/*
Storage system should be the one to create a storageKey when writing to a file
A storage key is a path for a local storage implementation

Client wants:
* get a readStream and hash for a given storage key
* get a writeStream for a new file, given certain identifying qualities
* to commit a write (closing the stream) and get back a storageKey; optionally provide a hash for verification purposes
* to update storage metadata for a file, potentially resulting in an updated storageKey (our LocalStorage Impl may want to move the file)
* compute a storagekey for a given assetversion

LocalStorage Impl wants:
* Identifier information to compute OCFL-compliant paths and metadata manifests

*/