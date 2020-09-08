import * as H from './helpers';

export interface IZip {
    load(): Promise<H.IOResults>;
    close(): Promise<H.IOResults>;
    getAllEntries(): string[];
    getJustFiles(): string[];
    getJustDirectories(): string[];
    streamContent(entry: string): Promise<NodeJS.ReadableStream | null>;
}