import * as fs from 'fs-extra';
import * as path from 'path';
import StreamZip from 'node-stream-zip';
import * as H from './helpers';
import { RecordKeeper as RK } from '../records/recordKeeper';
import { IZip, zipFilterResults } from './IZip';

// node-stream-zip can only decompress Stored (0) and Deflate (8). Anything else (Deflate64=9, BZIP2=12,
// LZMA=14, …) reads fine in the central directory but throws on extraction, which otherwise surfaces deep
// in a per-entry stream and reads as "invalid or corrupt". Detect it at load time and explain the fix.
const SUPPORTED_COMPRESSION_METHODS: number[] = [0, 8];
function compressionMethodLabel(method: number): string {
    switch (method) {
        case 9:  return 'Deflate64';
        case 12: return 'BZIP2';
        case 14: return 'LZMA';
        case 99: return 'AES-encrypted';
        default: return `method ${method}`;
    }
}
function unsupportedCompressionMessage(fileName: string, entry: string, method: number): string {
    return `Cannot read ZIP '${path.basename(fileName)}': entry '${entry}' uses unsupported compression (${compressionMethodLabel(method)}). `
        + 'Re-compress the package with standard Deflate — e.g. Windows "Send to → Compressed (zipped) folder", '
        + '7-Zip with Method "Deflate" (not Deflate64), or the "zip" CLI — and re-upload.';
}

/**
 * Zip contents are stored at the end of the zip file.  In order to decompress a zip file,
 * either we need to read everything into memory, or we need random access to the bits (i.e. via a file handle).
 * As a consequence of this, we've decided to locate our staged storage locally and provide access to the
 * underlying file names.  This allows us to use node-stream-zip, which avoids loading everything into
 * memory, but needs a filename in order to do so.
 */
export class ZipFile implements IZip {
    private _fileName: string;
    private _zip: StreamZip | null = null;
    private _entries: string[] = [];
    private _files: string[] = [];
    private _dirs: string[] = [];

    constructor(fileName: string) {
        this._fileName = fileName;
    }

    async load(): Promise<H.IOResults> {
        try {
            this._zip = new StreamZip({ file: this._fileName, storeEntries: true });
            return new Promise<H.IOResults>((resolve) => {
                /* istanbul ignore else */
                if (this._zip) {
                    this._zip.on('error', (error) => resolve({ success: false, error: `Error unzipping ${this._fileName} (${error.message})` }));
                    this._zip.on('ready', () => {
                        /* istanbul ignore else */
                        if (this._zip) {
                            this.clearState();
                            let unsupported: { entry: string; method: number } | null = null;
                            for (const entry of Object.values(this._zip.entries())) { /* istanbul ignore next */
                                if (entry.name.toUpperCase().startsWith('__MACOSX')) // ignore wacky MAC OSX resource folder stuffed into zips created on that platform
                                    continue; /* istanbul ignore next */
                                if (entry.name.toUpperCase().endsWith('/.DS_STORE')) // ignore wacky MAC OSX resource file stuffed into zips created on that platform
                                    continue;
                                this._entries.push(entry.name);
                                if (entry.isDirectory)
                                    this._dirs.push(entry.name);
                                else {
                                    this._files.push(entry.name);
                                    if (!unsupported && !SUPPORTED_COMPRESSION_METHODS.includes(entry.method))
                                        unsupported = { entry: entry.name, method: entry.method };
                                }
                            }
                            if (unsupported) {
                                const error: string = unsupportedCompressionMessage(this._fileName, unsupported.entry, unsupported.method);
                                RK.logError(RK.LogSection.eSYS,'load',error,{ fileName: this._fileName, entry: unsupported.entry, method: unsupported.method },'Utils.ZipFile');
                                resolve({ success: false, error });
                                return;
                            }
                            resolve({ success: true });
                        } else {
                            RK.logError(RK.LogSection.eSYS,'load','Zip not initialized',{ fileName: this._fileName },'Utils.ZipFile');
                            resolve({ success: false, error: 'Zip not initialized' });
                        }
                    });
                } else {
                    RK.logError(RK.LogSection.eSYS,'load','Zip not initialized',{ fileName: this._fileName },'Utils.ZipFile');
                    resolve({ success: false, error: 'Zip not initialized' });
                }
            });
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eSYS,'load',H.Helpers.getErrorString(error),{ fileName: this._fileName },'Utils.ZipFile');
            return { success: false, error: JSON.stringify(error) };
        }
    }

    async add(_fileNameAndPath: string, _inputStream: NodeJS.ReadableStream): Promise<H.IOResults> {
        RK.logError(RK.LogSection.eSYS,'add failed','not implemented',{ fileName: this._fileName, path: _fileNameAndPath },'Utils.ZipFile');
        return { success: false, error: 'Not Implemented' };
    }

    async close(): Promise<H.IOResults> {
        return new Promise<H.IOResults>((resolve) => {
            if (!this._zip)
                resolve({ success: true });
            else {
                this._zip.close(err => {
                    this.clearState();
                    this._zip = null;
                    /* istanbul ignore else */
                    if (!err)
                        resolve({ success: true });
                    else {
                        const error: string = `ZipFile.close ${err}`;
                        RK.logError(RK.LogSection.eSYS,'close failed',H.Helpers.getErrorString(err),{ fileName: this._fileName },'Utils.ZipFile');
                        resolve({ success: false, error });
                    }
                });
            }
        });
    }

    async getAllEntries(filter: string | null): Promise<string[]> { return zipFilterResults(this._entries, filter); }
    async getJustFiles(filter: string | null): Promise<string[]> { return zipFilterResults(this._files, filter); }
    async getJustDirectories(filter: string | null): Promise<string[]> { return zipFilterResults(this._dirs, filter); }

    async streamContent(entry: string | null): Promise<NodeJS.ReadableStream | null> {
        return new Promise<NodeJS.ReadableStream | null>((resolve) => {
            if (!this._zip)
                resolve(null);
            else {
                try {
                    if (!entry)
                        resolve(fs.createReadStream(this._fileName));
                    else {
                        this._zip.stream(entry, (error, stream) => {
                            if (!error && stream)
                                resolve(stream);
                            else {
                                RK.logError(RK.LogSection.eSYS,'stream content failed',H.Helpers.getErrorString(error),{ fileName: this._fileName, entry },'Utils.ZipFile');
                                resolve(null);
                            }
                        });
                    }
                } catch (error) /* istanbul ignore next */ {
                    RK.logError(RK.LogSection.eSYS,'stream content failed',`catch: ${H.Helpers.getErrorString(error)}`,{ fileName: this._fileName, entry },'Utils.ZipFile');
                    resolve(null);
                }
            }
        });
    }

    async uncompressedSize(entry: string): Promise<number | null> {
        return new Promise<number | null>((resolve) => {
            if (!this._zip)
                resolve(null);
            else {
                try {
                    const zipEntry = this._zip.entry(entry);
                    resolve((zipEntry) ? zipEntry.size : null);
                } catch (error) /* istanbul ignore next */ {
                    RK.logDebug(RK.LogSection.eSYS,'uncompressed size',H.Helpers.getErrorString(error),{ fileName: this._fileName, entry },'Utils.ZipFile');
                    resolve(null);
                }
            }
        });
    }

    /**
     * Return both uncompressed and compressed sizes for a single entry. Used by
     * the ZIP contents listing endpoint so the UI can show actual on-disk size.
     * Returns null if the entry is not found or the zip is closed.
     */
    async getEntryMetadata(entry: string): Promise<{ size: number; compressedSize: number } | null> {
        return new Promise<{ size: number; compressedSize: number } | null>((resolve) => {
            if (!this._zip)
                resolve(null);
            else {
                try {
                    const zipEntry = this._zip.entry(entry);
                    if (!zipEntry) {
                        resolve(null);
                        return;
                    }
                    resolve({ size: zipEntry.size, compressedSize: zipEntry.compressedSize });
                } catch (error) /* istanbul ignore next */ {
                    RK.logDebug(RK.LogSection.eSYS,'entry metadata',H.Helpers.getErrorString(error),{ fileName: this._fileName, entry },'Utils.ZipFile');
                    resolve(null);
                }
            }
        });
    }

    private clearState() {
        this._entries = [];
        this._files = [];
        this._dirs = [];
    }
}