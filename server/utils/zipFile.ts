import * as fs from 'fs-extra';
import StreamZip from 'node-stream-zip';

import * as LOG from './logger';
import * as H from './helpers';
import { IZip, zipFilterResults } from './IZip';

/**
 * Zip contents are stored at the end of the zip file.  In order to decompress a zip file,
 * either we need to read everything into memory, or we need random access to the bits (i.e. via a file handle).
 * As a consequence of this, we've decided to locate our staged storage locally and provide access to the
 * underlying file names.  This allows us to use node-stream-zip, which avoids loading everything into
 * memory, but needs a filename in order to do so.
 */
export class ZipFile implements IZip {
    private _fileName: string;
    private _logErrors: boolean = true;
    private _zip: StreamZip | null = null;
    private _entries: string[] = [];
    private _files: string[] = [];
    private _dirs: string[] = [];

    constructor(fileName: string, logErrors: boolean = true) {
        this._fileName = fileName;
        this._logErrors = logErrors;
    }

    async load(): Promise<H.IOResults> {
        try {
            this._zip = new StreamZip({ file: this._fileName, storeEntries: true });

            return new Promise<H.IOResults>((resolve) => {
                /* istanbul ignore else */
                if (this._zip) {
                    this._zip.on('error', () => resolve({ success: false, error: `Error unzipping ${this._fileName}` }));
                    this._zip.on('ready', () => {
                        /* istanbul ignore else */
                        if (this._zip) {
                            this.clearState();
                            for (const entry of Object.values(this._zip.entries())) { /* istanbul ignore next */
                                if (entry.name.toUpperCase().startsWith('__MACOSX')) // ignore wacky MAC OSX resource folder stuffed into zips created on that platform
                                    continue; /* istanbul ignore next */
                                if (entry.name.toUpperCase().endsWith('/.DS_STORE')) // ignore wacky MAC OSX resource file stuffed into zips created on that platform
                                    continue;
                                this._entries.push(entry.name);
                                if (entry.isDirectory)
                                    this._dirs.push(entry.name);
                                else
                                    this._files.push(entry.name);
                            }
                            resolve({ success: true, error: '' });
                        } else
                            resolve({ success: false, error: 'Zip not initialized' });
                    });
                } else
                    resolve({ success: false, error: 'Zip not initialized' });
            });
        } catch (error) /* istanbul ignore next */ {
            if (this._logErrors)
                LOG.error('ZipFile.load', LOG.LS.eSYS, error);
            return { success: false, error: JSON.stringify(error) };
        }
    }

    async add(_fileNameAndPath: string, _inputStream: NodeJS.ReadableStream): Promise<H.IOResults> {
        return { success: false, error: 'Not Implemented' };
    }

    async close(): Promise<H.IOResults> {
        return new Promise<H.IOResults>((resolve) => {
            if (!this._zip)
                resolve({ success: true, error: '' });
            else {
                this._zip.close(err => {
                    this.clearState();
                    this._zip = null;
                    /* istanbul ignore else */
                    if (!err)
                        resolve({ success: true, error: '' });
                    else {
                        const error: string = `ZipFile.close ${err}`;
                        LOG.error(error, LOG.LS.eSYS);
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
                                LOG.info(`ZipFile.streamContent ${entry}: ${JSON.stringify(error)}`, LOG.LS.eSYS);
                                resolve(null);
                            }
                        });
                    }
                } catch (error) /* istanbul ignore next */ {
                    LOG.info(`ZipFile.streamContent ${entry}: ${JSON.stringify(error)}`, LOG.LS.eSYS);
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
                    LOG.info(`ZipFile.uncompressedSize ${entry}: ${JSON.stringify(error)}`, LOG.LS.eSYS);
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