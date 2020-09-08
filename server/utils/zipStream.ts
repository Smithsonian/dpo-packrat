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
            this._entries = [];
            for (const entry in this._zip.files) {
                /* istanbul ignore if */
                if (entry.toUpperCase().startsWith('__MACOSX')) // ignore wacky MAC OSX resource folder stuffed into zips created on that platform
                    continue;
                this._entries.push(entry);
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

    getAllEntries(): string[] {
        return this._entries;
    }

    getJustFiles(): string[] {
        return this.computeContents(false);
    }

    getJustDirectories(): string[] {
        return this.computeContents(true);
    }

    private computeContents(directories: boolean): string[] {
        const retValue: string[] = [];
        if (!this._zip)
            return retValue;

        for (const entry of this._entries) {
            const isDirectoryEntry: boolean = (entry.endsWith('/'));

            if (isDirectoryEntry && directories)
                retValue.push(entry);
            else if (!isDirectoryEntry && !directories)
                retValue.push(entry);
        }
        return retValue;
    }

    async streamContent(entry: string): Promise<NodeJS.ReadableStream | null> {
        if (!this._zip)
            return null;
        const ZO: JSZip.JSZipObject | null = this._zip.file(entry);
        return (ZO) ? ZO.nodeStream() : null;
    }
}