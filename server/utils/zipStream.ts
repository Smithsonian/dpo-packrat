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

    async load(): Promise<H.IOResults> {
        try {
            // this._inputStream
            const chunks: Buffer[] = [];

            const P = new Promise<Buffer>((resolve, reject) => {
                this._inputStream.on('data', (chunk: Buffer) => chunks.push(chunk)); /* istanbul ignore next */
                this._inputStream.on('error', () => reject());
                this._inputStream.on('end', () => resolve(Buffer.concat(chunks)));
            });
            // const allData = await P;

            this._zip = await JSZ.loadAsync(await P);
            this._entries = [];
            for (const entry in this._zip.files) {
                /* istanbul ignore if */
                if (entry.toUpperCase().startsWith('__MACOSX'))
                    continue;
                this._entries.push(entry);
            }
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('ZipStream.load', error);
            return {
                success: false,
                error: JSON.stringify(error)
            };
        }
        return {
            success: true,
            error: ''
        };
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