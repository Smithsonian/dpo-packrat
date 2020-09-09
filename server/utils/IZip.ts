import * as H from './helpers';

export interface IZip {
    load(): Promise<H.IOResults>;
    close(): Promise<H.IOResults>;
    getAllEntries(): Promise<string[]>;
    getJustFiles(): Promise<string[]>;
    getJustDirectories(): Promise<string[]>;
    streamContent(entry: string): Promise<NodeJS.ReadableStream | null>;
}