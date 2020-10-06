import * as H from './helpers';

export interface IZip {
    load(): Promise<H.IOResults>;
    close(): Promise<H.IOResults>;
    getAllEntries(filter: string | null): Promise<string[]>;
    getJustFiles(filter: string | null): Promise<string[]>;
    getJustDirectories(filter: string | null): Promise<string[]>;
    streamContent(entry: string): Promise<NodeJS.ReadableStream | null>;
    uncompressedSize(entry: string): Promise<number | null>;
}

export function zipFilterResults(entries: string[], filter: string | null): string[] {
    if (!filter)
        return entries;

    const retValue: string[] = [];
    for (const entry of entries)
        if (entry.includes(filter))
            retValue.push(entry);
    return retValue;
}