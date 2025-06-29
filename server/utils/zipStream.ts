import JSZip, * as JSZ from 'jszip';
import * as H from './helpers';
import { RecordKeeper as RK } from '../records/recordKeeper';
import { IZip, zipFilterResults } from './IZip';

/**
 * This ZIP implementation uses JSZip and reads everything into memory before unzipping.
 * Use zipFile when you have a filename and you want fully streamed behavior -
 * the file won't be read into memory all at once.
 */
export class ZipStream implements IZip {
    private _inputStream: NodeJS.ReadableStream | null;
    private _zip: JSZip | null = null;
    private _entries: Set<string> = new Set<string>();
    private _files: Set<string> = new Set<string>();
    private _dirs: Set<string> = new Set<string>();

    constructor(inputStream: NodeJS.ReadableStream | null = null) {
        this._inputStream = inputStream;
    }

    async load(): Promise<H.IOResults> {
        if (!this._inputStream) {
            const error: string = 'ZipStream.load called with no input stream';
            RK.logError(RK.LogSection.eSYS,'load failed','called with no input stream',{ files: this._files },'Utils.ZipStream');
            return { success: false, error };
        }

        try {
            const chunks: Buffer[] = [];

            const P = new Promise<Buffer>((resolve, reject) => {
                this._inputStream!.on('data', (chunk: Buffer) => chunks.push(chunk)); /* istanbul ignore next */    // eslint-disable-line @typescript-eslint/no-non-null-assertion
                this._inputStream!.on('error', (error) => reject(error));                                           // eslint-disable-line @typescript-eslint/no-non-null-assertion
                this._inputStream!.on('end', () => resolve(Buffer.concat(chunks)));                                 // eslint-disable-line @typescript-eslint/no-non-null-assertion
            });

            this._zip = await JSZ.loadAsync(await P);
            return this.extractEntries();
        } catch (err) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eSYS,'load failed',H.Helpers.getErrorString(err),{ files: this._files },'Utils.ZipStream');
            return { success: false, error: 'ZipStream.load' };
        }
    }

    /** fileNameAndPath should use posix-compliant path separators, i.e. forward slashes */
    async add(fileNameAndPath: string, inputStream: NodeJS.ReadableStream): Promise<H.IOResults> {
        if (!this._zip)
            this._zip = new JSZip();

        try {
            this._zip.file(fileNameAndPath, H.Helpers.readFileFromStreamThrowErrors(inputStream), { binary: true });
            return this.extractEntries(); // Order n^2 if we're add()'ing lots of entries.
        } catch (err) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eSYS,'add failed',H.Helpers.getErrorString(err),{ path: fileNameAndPath, files: this._files },'Utils.ZipStream');
            return { success: false, error: 'ZipStream.add' };
        }
    }

    protected extractEntries(): H.IOResults {
        /* istanbul ignore next */
        if (!this._zip)
            return { success: true };
        try {
            this.clearState();
            for (const entry in this._zip.files)
                this.extractEntry(entry);
        } catch (err) /* istanbul ignore next */ {
            const error: string = `ZipStream.extractEntries: ${JSON.stringify(err)}`;
            RK.logError(RK.LogSection.eSYS,'extract entries failed',H.Helpers.getErrorString(err),{ files: this._files },'Utils.ZipStream');
            return { success: false, error };
        }
        return { success: true };
    }

    protected extractEntry(entry: string): void {
        /* istanbul ignore next */
        if (entry.toUpperCase().startsWith('__MACOSX')) // ignore wacky MAC OSX resource folder stuffed into zips created on that platform
            return; /* istanbul ignore next */
        if (entry.toUpperCase().endsWith('/.DS_STORE')) // ignore wacky MAC OSX resource file stuffed into zips created on that platform
            return;
        this._entries.add(entry);

        const isDirectoryEntry: boolean = (entry.endsWith('/'));
        if (isDirectoryEntry)
            this._dirs.add(entry);
        else
            this._files.add(entry);
    }

    async close(): Promise<H.IOResults> {
        this._zip = null;
        return { success: true };
    }

    async getAllEntries(filter: string | null): Promise<string[]> { return zipFilterResults(Array.from(this._entries.values()), filter); }
    async getJustFiles(filter: string | null): Promise<string[]> { return zipFilterResults(Array.from(this._files.values()), filter); }
    async getJustDirectories(filter: string | null): Promise<string[]> { return zipFilterResults(Array.from(this._dirs.values()), filter); }

    async streamContent(entry: string | null): Promise<NodeJS.ReadableStream | null> {
        try {
            if (!this._zip) {
                RK.logError(RK.LogSection.eSYS,'stream content failed','no zip object',{ entry, files: this._files },'Utils.ZipStream');
                return null;
            }
            if (!entry)
                return this._zip.generateNodeStream({ streamFiles: true, compression: 'DEFLATE', compressionOptions: { level: 8 } }); // we seem to experience issues with zipFile uncompressing "level 9" compression, which perahsp corresponds to PKWare's DEFLATE64, per this article: https://github.com/thejoshwolfe/yauzl/issues/58
            else {
                const ZO: JSZip.JSZipObject | null = this._zip.file(entry);
                RK.logError(RK.LogSection.eSYS,'stream content failed','no zip object from entry',{ entry, files: this._files },'Utils.ZipStream');
                return (ZO) ? ZO.nodeStream() : null;
            }
        } catch (err) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eSYS,'load failed',H.Helpers.getErrorString(err),{ entry, files: this._files },'Utils.ZipStream');
            return null;
        }
    }

    async uncompressedSize(entry: string): Promise<number | null> {
        const stream: NodeJS.ReadableStream | null = await this.streamContent(entry);
        if (!stream) {
            if(this._dirs.has(entry)) {
                RK.logWarning(RK.LogSection.eSYS,'compute uncompressed size','directory or zero length file',{ entry },'Utils.ZipStream');
                return 0;
            } else {
                RK.logError(RK.LogSection.eSYS,'compute uncompressed size failed','invalid entry',{ entry },'Utils.ZipStream');
                return null;
            }
        }
        return H.Helpers.computeSizeOfStream(stream);
    }

    private clearState() {
        this._entries.clear();
        this._files.clear();
        this._dirs.clear();
    }
}
