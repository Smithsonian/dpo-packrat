import * as H from '../utils/helpers';
import * as LOG from '../utils/logger';
import * as CACHE from '../cache';

import * as path from 'path';
import { ExifTool, Tags } from 'exiftool-vendored';
import { fileTypeSupportedByExiftool } from './ExiftoolUtil';
import tmp from 'tmp-promise';
import { imageSize } from 'image-size';
import { pathExists } from 'fs-extra';

export class MetadataExtractor {
    metadata: Map<string, string> = new Map<string, string>();  // Map of metadata name -> value
    eMetadataSource: CACHE.eVocabularyID | null = null;
    static exiftool: ExifTool = new ExifTool();

    async extractMetadata(fileName: string, inputStream?: NodeJS.ReadableStream | undefined): Promise<H.IOResults> {
        try {
            if (!inputStream && !await pathExists(fileName))
                return { success: false, error: `Extractor.extractMetadata could not locate ${fileName}` };
        } catch (err) /* istanbul ignore next */ {
            return { success: false, error: `Extractor.extractMetadata could not locate ${fileName}: ${JSON.stringify(err)}` };
        }

        let results: H.IOResults = { success: true, error: '' };
        if (fileTypeSupportedByExiftool(fileName))
            results = await this.extractMetadataImage(fileName, inputStream); /* istanbul ignore next */

        if (!results.success)
            LOG.error(`Extractor.extractMetadata failed: ${results.error}`, LOG.LS.eMETA);
        return results;
    }

    clear(): void {
        this.metadata.clear();
    }

    async idVMetadataSource(): Promise<number | undefined> {
        return this.eMetadataSource ? CACHE.VocabularyCache.vocabularyEnumToId(this.eMetadataSource) : undefined;
    }

    private async extractMetadataImage(fileName: string, inputStream?: NodeJS.ReadableStream | undefined): Promise<H.IOResults> {
        const originalMetadataSize: number = this.metadata.size;
        let tempFile: tmp.FileResult | null = null;

        try {
            let fileNameToParse: string = fileName;
            if (inputStream) {
                const extension: string = path.extname(fileName);
                tempFile = await tmp.file({ mode: 644, postfix: extension });

                const results: H.IOResults = await H.Helpers.writeStreamToFile(inputStream, tempFile.path); /* istanbul ignore next */
                if (!results.success) {
                    LOG.error(`MetadataExtractor.extractMetadataImage unable to create temp file ${tempFile.path}: ${results.error}`, LOG.LS.eMETA);
                    return results;
                }
                fileNameToParse = tempFile.path;
            }

            const extractions: Tags | null = await MetadataExtractor.exiftool.read(fileNameToParse); // istanbul ignore next
            if (extractions.errors && extractions.errors.length > 0)
                LOG.info(`MetadataExtractor.extractMetadataImage encountered issues: ${JSON.stringify(extractions.errors)}`, LOG.LS.eMETA);

            for (const [name, valueU] of Object.entries(extractions)) {
                switch (name) { // skip attributes that are not themselves tags:
                    case 'errors':
                    case 'Error':
                    case 'Warning':
                    case 'SourceFile':
                    case 'tz':
                    case 'tzSource':
                        continue;
                }

                let value: string;
                if (typeof(valueU) === 'string')
                    value = valueU;
                else if (typeof(valueU) === 'number')
                    value = valueU.toString(); /* istanbul ignore next */
                else if (valueU instanceof Date)
                    value = valueU.toISOString();
                else if (typeof(valueU) === 'object')
                    value = JSON.stringify(valueU, H.Helpers.saferStringify);
                else
                    value = String(valueU); /* istanbul ignore next */

                if (this.metadata.has(name))
                    LOG.info(`Extractor.extractMetadataImage already has value for ${name}`, LOG.LS.eMETA);
                this.metadata.set(name, value);
            }

            // If our exif/iptc/jfif info does not contain height & width, calculate that directly using image-size:
            /* istanbul ignore next */
            if (!this.metadata.has('ImageHeight') || !this.metadata.has('ImageWidth')) {
                const dimensions = imageSize(fileNameToParse);
                if (dimensions.height)
                    this.metadata.set('ImageHeight', dimensions.height.toString());
                if (dimensions.width)
                    this.metadata.set('ImageWidth', dimensions.width.toString());
            }

            // if we picked up any new metadata records, mark the metadata source as image
            /* istanbul ignore else */
            if (originalMetadataSize !== this.metadata.size)
                this.eMetadataSource = CACHE.eVocabularyID.eMetadataMetadataSourceImage;
        } catch (err) /* istanbul ignore next */ {
            const error: string = `Extractor.extractMetadataImage failed: ${JSON.stringify(err, H.Helpers.saferStringify)}`;
            LOG.error(error, LOG.LS.eMETA, err);
            return { success: false, error };
        } finally {
            if (tempFile)
                await tempFile.cleanup();
        }

        return { success: true, error: '' };
    }
}