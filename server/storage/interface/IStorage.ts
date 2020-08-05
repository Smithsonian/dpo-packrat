interface IStorage {
    // readStream(storageKey)
    // writeStream(storageKey)
    // moveFile(storageKey, newFolder)
    validateHash(storageKey: string, hash: string): boolean;
}

export { IStorage as default };

