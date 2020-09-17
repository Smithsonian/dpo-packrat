import JSZip, * as JSZ from 'jszip';
import * as LOG from './logger';
import * as H from './helpers';
import { IZip } from './IZip';

/**
 * This ZIP implementation uses JSZip and reads everything into memory before unzipping.
 * Use zipStreamReader when you have a filename and you want fully streamed behavior -
 * the file won't be read into memory all at once.
 */
export class ZipStream implements IZip {
    private _inputStream: NodeJS.ReadableStream;
    private _zip: JSZip | null = null;
    private _entries: string[] = [];
    private _files: string[] = [];
    private _dirs: string[] = [];

    constructor(inputStream: NodeJS.ReadableStream) {
        this._inputStream = inputStream;
    }

    async load(): Promise<H.IOResults> {
        try {
            // this._inputStream
            const chunks: Buffer[] = [];

            const P = new Promise<Buffer>((resolve, reject) => {
                this._inputStream.on('data', (chunk: Buffer) => chunks.push(chunk)); /* istanbul ignore next */
                this._inputStream.on('error', () => reject());
                this._inputStream.on('end', () => resolve(Buffer.concat(chunks)));
            });

            this._zip = await JSZ.loadAsync(await P);
            this.clearState();

            for (const entry in this._zip.files) {
                /* istanbul ignore if */
                if (entry.toUpperCase().startsWith('__MACOSX')) // ignore wacky MAC OSX resource folder stuffed into zips created on that platform
                    continue;
                this._entries.push(entry);

                const isDirectoryEntry: boolean = (entry.endsWith('/'));
                if (isDirectoryEntry)
                    this._dirs.push(entry);
                else
                    this._files.push(entry);
            }
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('ZipStream.load', error);
            return { success: false, error: JSON.stringify(error) };
        }
        return { success: true, error: '' };
    }

    async close(): Promise<H.IOResults> {
        return { success: true, error: '' };
    }

    async getAllEntries(): Promise<string[]> { return this._entries; }
    async getJustFiles(): Promise<string[]> { return this._files; }
    async getJustDirectories(): Promise<string[]> { return this._dirs; }

    async streamContent(entry: string): Promise<NodeJS.ReadableStream | null> {
        try {
            if (!this._zip)
                return null;
            const ZO: JSZip.JSZipObject | null = this._zip.file(entry);
            return (ZO) ? ZO.nodeStream() : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error(`zipStream.streamContent ${entry}`, error);
            return null;
        }
    }

    private clearState() {
        this._entries = [];
        this._files = [];
        this._dirs = [];
    }
}