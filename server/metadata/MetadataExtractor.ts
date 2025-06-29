import * as H from '../utils/helpers';
import * as CACHE from '../cache';
import * as COMMON from '@dpo-packrat/common';
import { IExtractor, IExtractorResults } from './IExtractor';
import { RecordKeeper as RK } from '../records/recordKeeper';

import { pathExists } from 'fs-extra';
import { ExtractorImageExifr } from './ExtractorImageExifr';
import * as path from 'path';
// import { ExtractorImageExiftool } from './ExtractorImageExiftool'; Loaded dynamically due to install issues with exiftool-vendored when performed in a linux container from a non-linux system (windows or macos)
type ExifModule = typeof import('./ExtractorImageExiftool');

export class MetadataExtractor {
    metadata: Map<string, string> = new Map<string, string>();  // Map of metadata name -> value
    eMetadataSource: COMMON.eVocabularyID | null = null;
    static extractorImage: IExtractor | null = null;

    constructor(eMetadataSource?: COMMON.eVocabularyID | null) {
        this.eMetadataSource = eMetadataSource ?? null;
    }

    async extractMetadata(fileName: string, inputStream?: NodeJS.ReadableStream | undefined): Promise<H.IOResults> {
        try {
            if (!inputStream && !await pathExists(fileName)) {
                RK.logError(RK.LogSection.eMETA,'extract metadata failed',`could not locate ${fileName}`,{ fileName },'Metadata.Extractor');
                return { success: false, error: `MetadataExtractor.extractMetadata could not locate ${fileName}` };
            }
        } catch (err) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eMETA,'extract metadata failed',`could not locate ${fileName}: ${err}`,{ fileName },'Metadata.Extractor');
            return { success: false, error: `MetadataExtractor.extractMetadata could not locate ${fileName}: ${JSON.stringify(err)}` };
        }

        let results: IExtractorResults = await this.initializeExtractorImage();
        if (!results.success)
            return results;
        if (MetadataExtractor.extractorImage) {
            if (MetadataExtractor.extractorImage.fileTypeHandled(fileName)) {
                results = this.mergeResults(await MetadataExtractor.extractorImage.extractMetadata(fileName, inputStream));
                if (results.success && results.metadata && results.metadata.size > 0)
                    this.eMetadataSource = MetadataExtractor.extractorImage.eMetadataSource();
            } else
                RK.logWarning(RK.LogSection.eMETA,'extract metadata','does not handle filetype',{ fileName },'Metadata.Extractor');
        }

        if (!results.success)
            RK.logError(RK.LogSection.eMETA,'extract metadata failed',results.error,{ fileName },'Metadata.Extractor');
        return results;
    }

    clear(): void {
        this.metadata.clear();
    }

    async idVMetadataSource(): Promise<number | undefined> {
        return this.eMetadataSource ? CACHE.VocabularyCache.vocabularyEnumToId(this.eMetadataSource) : undefined;
    }

    private mergeResults(results: IExtractorResults): IExtractorResults {
        if (!results.success)
            return results;
        if (!results.metadata || results.metadata.size <= 0)
            return results;
        if (this.metadata.size === 0)
            this.metadata = results.metadata;
        else {
            for (const [name, value] of results.metadata) {
                if (!this.metadata.has(name))
                    this.metadata.set(name, value);
            }
        }
        return results;
    }

    private async initializeExtractorImage(): Promise<IExtractorResults> {
        let results: IExtractorResults = { success: true };
        if (MetadataExtractor.extractorImage)
            return results;

        try {
            // try to load .ts first, then fall back to .js ... needed for production builds!
            let exifModule: ExifModule | null = await this.importModule(path.join(__dirname, 'ExtractorImageExiftool.ts'), false);
            if (!exifModule)
                exifModule = await this.importModule(path.join(__dirname, 'ExtractorImageExiftool.js'), true);
            if (exifModule) {
                const extractor: IExtractor = new exifModule.ExtractorImageExiftool();
                results = await extractor.initialize();
                if (results.success) {
                    RK.logInfo(RK.LogSection.eMETA,'initialize extractor success','using exiftool',{},'Metadata.Extractor');
                    MetadataExtractor.extractorImage = extractor;
                    return results;
                }
            }
            RK.logError(RK.LogSection.eMETA,'initialize extractor failed',`failed to initialize exiftool: ${results.error ?? 'import failed'}`,{},'Metadata.Extractor');
        } catch (err) {
            RK.logError(RK.LogSection.eMETA,'initialize extractor failed',`failed to initialize exiftool: ${err}`,{},'Metadata.Extractor');
        }

        results.error = '';
        try {
            const extractor: IExtractor = new ExtractorImageExifr();
            results = await extractor.initialize();
            if (results.success) {
                RK.logInfo(RK.LogSection.eMETA,'initialize extractor success','using exifr',{},'Metadata.Extractor');
                MetadataExtractor.extractorImage = extractor;
                return results;
            }
            RK.logError(RK.LogSection.eMETA,'initialize extractor failed',`failed to initialize exifr: ${results.error}`,{},'Metadata.Extractor');
        } catch (err) {
            RK.logError(RK.LogSection.eMETA,'initialize extractor failed',`failed to initialize exifr. catch: ${err}`,{},'Metadata.Extractor');
        }

        RK.logError(RK.LogSection.eMETA,'initialize extractor failed','unable to load exiftool and exifr',{},'Metadata.Extractor');
        return results;
    }

    private async importModule(moduleName: string, exceptionsAreErrors: boolean): Promise<ExifModule | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            RK.logDebug(RK.LogSection.eMETA,'import module',undefined,{ moduleName },'Metadata.Extractor');
            return await import(moduleName);
        } catch (err) {
            if (exceptionsAreErrors)
                RK.logError(RK.LogSection.eMETA,'import module failed',`exceptions: ${err}`,{ moduleName },'Metadata.Extractor');
            else
                RK.logError(RK.LogSection.eMETA,'import module failed',H.Helpers.getErrorString(err),{ moduleName },'Metadata.Extractor');
            return null;
        }
    }
}