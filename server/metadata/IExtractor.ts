import * as H from '../utils/helpers';
import * as CACHE from '../cache';

export interface IExtractorResults extends H.IOResults {
    metadata?: Map<string, string> | undefined; // Map of metadata name -> value
}

export interface IExtractor {
    initialize(): Promise<IExtractorResults>;
    fileTypeHandled(fileName: string): boolean;
    extractMetadata(fileName: string, inputStream?: NodeJS.ReadableStream | undefined): Promise<IExtractorResults>;
    eMetadataSource(): CACHE.eVocabularyID | null;
}