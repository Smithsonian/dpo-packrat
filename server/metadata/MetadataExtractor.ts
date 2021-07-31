import * as H from '../utils/helpers';
import * as LOG from '../utils/logger';
import * as CACHE from '../cache';

import * as path from 'path';
import exifr from 'exifr';
import { imageSize } from 'image-size';
import { pathExists } from 'fs-extra';

export class MetadataExtractor {
    metadata: Map<string, string> = new Map<string, string>();  // Map of metadata name -> value
    eMetadataSource: CACHE.eVocabularyID | null = null;

    static exifrFormatOptions = {
        translateKeys: true,
        translateValues: true,
        reviveValues: true,
        parse: true,
    };

    static exifrOptions = {
        tiff: MetadataExtractor.exifrFormatOptions,
        ifd0: MetadataExtractor.exifrFormatOptions,
        ifd1: MetadataExtractor.exifrFormatOptions,
        exif: MetadataExtractor.exifrFormatOptions,
        gps: MetadataExtractor.exifrFormatOptions,
        xmp: MetadataExtractor.exifrFormatOptions,
        iptc: MetadataExtractor.exifrFormatOptions,
        sanitize: true,
        mergeOutput: true,
    };

    async extractMetadata(fileName: string, inputStream?: NodeJS.ReadableStream | undefined): Promise<H.IOResults> {
        try {
            if (!inputStream && !await pathExists(fileName))
                return { success: false, error: `Extractor.extractMetadata could not locate ${fileName}` };
        } catch (err) /* istanbul ignore next */ {
            return { success: false, error: `Extractor.extractMetadata could not locate ${fileName}: ${JSON.stringify(err)}` };
        }

        let results: H.IOResults = { success: true, error: '' };
        const extension: string = path.extname(fileName).toLowerCase();
        switch (extension) { /* istanbul ignore next */
            default: break;

            case '.jpg':
            case '.jpeg':
            case '.tif':
            case '.tiff':
            case '.png':
            case '.heic':
            case '.avif':
            case '.iiq':
                results = await this.extractMetadataImage(fileName, inputStream);
                break;
        } /* istanbul ignore next */

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
        try {
            let extractions: any = { }; // eslint-disable-line @typescript-eslint/no-explicit-any
            if (inputStream) {
                const buffer: Buffer | null = await H.Helpers.readFileFromStream(inputStream); /* istanbul ignore next */
                if (!buffer)
                    return { success: false, error: 'Extractor.extractMetadataImage could not load buffer from inputstream' };
                extractions = await exifr.parse(buffer, MetadataExtractor.exifrOptions);
            } else
                extractions = await exifr.parse(fileName, MetadataExtractor.exifrOptions);

            for (const [name, valueU] of Object.entries(extractions)) {
                let value: string;
                if (typeof(valueU) === 'string')
                    value = valueU;
                else if (typeof(valueU) === 'number')
                    value = valueU.toString();
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
            if (!this.metadata.has('ImageHeight') || !this.metadata.has('ImageWidth')) {
                const dimensions = imageSize(fileName); /* istanbul ignore next */
                if (dimensions.height)
                    this.metadata.set('ImageHeight', dimensions.height.toString()); /* istanbul ignore next */
                if (dimensions.width)
                    this.metadata.set('ImageWidth', dimensions.width.toString());
            }

            // if we picked up any new metadata records, mark the metadata source as image
            /* istanbul ignore else */
            if (originalMetadataSize !== this.metadata.size)
                this.eMetadataSource = CACHE.eVocabularyID.eMetadataMetadataSourceImage;
        } catch (err) /* istanbul ignore next */ {
            return { success: false, error: `Extractor.extractMetadataImage failed: ${JSON.stringify(err, H.Helpers.saferStringify)}` };
        }

        return { success: true, error: '' };
    }
}