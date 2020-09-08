import * as LOG from './logger';
import * as H from './helpers';
import { IZip } from './IZip';
import StreamZip = require('node-stream-zip');

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
                    this._zip.on('error', () => resolve({ success: false, error: `Error unzipping ${this._fileName}` }));
                    this._zip.on('ready', () => {
                        /* istanbul ignore else */
                        if (this._zip) {
                            this.clearState();
                            for (const entry of Object.values(this._zip.entries())) { /* istanbul ignore next */
                                if (entry.name.toUpperCase().startsWith('__MACOSX')) // ignore wacky MAC OSX resource folder stuffed into zips created on that platform
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
            LOG.logger.error('ZipFile.load', error);
            return { success: false, error: JSON.stringify(error) };
        }
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
                        LOG.logger.error(error);
                        resolve({ success: false, error });
                    }
                });
            }
        });
    }

    getAllEntries(): string[] { return this._entries; }
    getJustFiles(): string[] { return this._files; }
    getJustDirectories(): string[] { return this._dirs; }

    async streamContent(entry: string): Promise<NodeJS.ReadableStream | null> {
        return new Promise<NodeJS.ReadableStream | null>((resolve) => {
            if (!this._zip)
                resolve(null);
            else {
                this._zip.stream(entry, (error, stream) => {
                    if (!error && stream)
                        resolve(stream);
                    else {
                        LOG.logger.error('ZipFile.streamContent', error);
                        resolve(null);
                    }
                });
            }
        });
    }

    private clearState() {
        this._entries = [];
        this._files = [];
        this._dirs = [];
    }
}