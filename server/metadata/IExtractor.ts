import * as H from '../utils/helpers';
import * as COMMON from '../../client/src/types/server';

export interface IExtractorResults extends H.IOResults {
    metadata?: Map<string, string> | undefined; // Map of metadata name -> value
}

export interface IExtractor {
    initialize(): Promise<IExtractorResults>;
    fileTypeHandled(fileName: string): boolean;
    extractMetadata(fileName: string, inputStream?: NodeJS.ReadableStream | undefined): Promise<IExtractorResults>;
    eMetadataSource(): COMMON.eVocabularyID | null;
}