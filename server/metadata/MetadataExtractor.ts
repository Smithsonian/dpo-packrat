import * as H from '../utils/helpers';
import * as LOG from '../utils/logger';
import * as CACHE from '../cache';
import { IExtractor, IExtractorResults } from './IExtractor';

import { pathExists } from 'fs-extra';
import { ExtractorImageExiftool } from './ExtractorImageExiftool';
import { ExtractorImageExifr } from './ExtractorImageExifr';

export class MetadataExtractor {
    metadata: Map<string, string> = new Map<string, string>();  // Map of metadata name -> value
    eMetadataSource: CACHE.eVocabularyID | null = null;
    static extractorImage: IExtractor | null = null;

    async extractMetadata(fileName: string, inputStream?: NodeJS.ReadableStream | undefined): Promise<H.IOResults> {
        try {
            if (!inputStream && !await pathExists(fileName))
                return { success: false, error: `MetadataExtractor.extractMetadata could not locate ${fileName}` };
        } catch (err) /* istanbul ignore next */ {
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
            }
        }

        if (!results.success)
            LOG.error(`MetadataExtractor.extractMetadata failed: ${results.error}`, LOG.LS.eMETA);
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
        let results: IExtractorResults = { success: true, error: '' };
        if (MetadataExtractor.extractorImage)
            return results;

        try {
            const extractor: IExtractor = new ExtractorImageExiftool();
            results = await extractor.initialize();
            if (results.success) {
                LOG.info('MetadataExtractor.initializeExtractorImage using exiftool', LOG.LS.eMETA);
                MetadataExtractor.extractorImage = extractor;
                return results;
            }
        } catch (err) {
            LOG.error('MetadataExtractor.initializeExtractorImage failed to initialize exiftool', LOG.LS.eMETA, err);
        }

        try {
            const extractor: IExtractor = new ExtractorImageExifr();
            results = await extractor.initialize();
            if (results.success) {
                LOG.info('MetadataExtractor.initializeExtractorImage using exifr', LOG.LS.eMETA);
                MetadataExtractor.extractorImage = extractor;
                return results;
            }
        } catch (err) {
            LOG.error('MetadataExtractor.initializeExtractorImage failed to initialize exifr', LOG.LS.eMETA, err);
        }

        LOG.error(`MetadataExtractor.initializeExtractorImage unable to load exiftool and exifr: ${results.error}`, LOG.LS.eMETA);
        return results;
    }
}