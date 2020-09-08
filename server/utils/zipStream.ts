import JSZip, * as JSZ from 'jszip';
import * as LOG from './logger';
import * as H from './helpers';

export class ZipStream {
    private _inputStream: NodeJS.ReadableStream;
    private _zip: JSZip | null = null;
    private _entries: string[] = [];

    constructor(inputStream: NodeJS.ReadableStream) {
        this._inputStream = inputStream;
    }

    // TODO: convert ZipStream.load() into a method that avoids loading the full contents into memory
    // The package node-stream-zip (https://github.com/antelle/node-stream-zip) avoids reading
    //  everything into memory, but it requires a filename. Our storage system works with streams --
    // we can't assume that the zip is present on disk, as we intend to support other storage implementations,
    // such as cloud-based storage. One approach here would be to fork node-stream-zip and add a stream-based,
    // promise wrapper. My first step here is to request an enhancment; let's see what comes of this (JT 2020-09-07)
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

    get allEntries(): string[] {
        return this._entries;
    }

    get justFiles(): string[] {
        return this.computeContents(false);
    }

    get justDirectories(): string[] {
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

    streamContent(entry: string): NodeJS.ReadableStream | null {
        if (!this._zip)
            return null;
        const ZO: JSZip.JSZipObject | null = this._zip.file(entry);
        return (ZO) ? ZO.nodeStream() : null;
    }
}