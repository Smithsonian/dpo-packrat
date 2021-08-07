import { IExtractor, IExtractorResults } from './IExtractor';
import * as LOG from '../utils/logger';
import * as H from '../utils/helpers';
import * as CACHE from '../cache';

import * as path from 'path';
import exifr from 'exifr';
import { imageSize } from 'image-size';

export class ExtractorImageExifr implements IExtractor  {
    async initialize(): Promise<IExtractorResults> {
        return { success: true, error: '' };
    }

    fileTypeHandled(fileName: string): boolean {
        const extension: string = path.extname(fileName).toLowerCase();
        switch (extension) {
            case '.jpg':
            case '.jpeg':
            case '.tif':
            case '.tiff':
            case '.png':
            case '.heic':
            case '.avif':
            case '.iiq':
                return true;
        } /* istanbul ignore next */
        return false;
    }

    async extractMetadata(fileName: string, inputStream?: NodeJS.ReadableStream | undefined): Promise<IExtractorResults> {
        const metadata: Map<string, string> = new Map<string, string>();  // Map of metadata name -> value
        try {
            let extractions: any = { }; // eslint-disable-line @typescript-eslint/no-explicit-any
            if (inputStream) {
                const buffer: Buffer | null = await H.Helpers.readFileFromStream(inputStream); /* istanbul ignore next */
                if (!buffer)
                    return { success: false, error: 'ExtractorImageExifr.extractMetadata could not load buffer from inputstream' };
                extractions = await exifr.parse(buffer, ExtractorImageExifr.exifrOptions);
            } else
                extractions = await exifr.parse(fileName, ExtractorImageExifr.exifrOptions);

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

                if (metadata.has(name))
                    LOG.info(`ExtractorImageExifr.extractMetadata already has value for ${name}`, LOG.LS.eMETA);
                metadata.set(name, value);
            }

            // If our exif/iptc/jfif info does not contain height & width, calculate that directly using image-size:
            if (!metadata.has('ImageHeight') || !metadata.has('ImageWidth')) {
                const dimensions = imageSize(fileName); /* istanbul ignore next */
                if (dimensions.height)
                    metadata.set('ImageHeight', dimensions.height.toString()); /* istanbul ignore next */
                if (dimensions.width)
                    metadata.set('ImageWidth', dimensions.width.toString());
            }
        } catch (err) /* istanbul ignore next */ {
            return { success: false, error: `ExtractorImageExifr.extractMetadata failed: ${JSON.stringify(err, H.Helpers.saferStringify)}` };
        }

        return { success: true, error: '', metadata };
    }

    eMetadataSource(): CACHE.eVocabularyID | null {
        return CACHE.eVocabularyID.eMetadataMetadataSourceImage;
    }

    static exifrFormatOptions = {
        translateKeys: true,
        translateValues: true,
        reviveValues: true,
        parse: true,
    };

    static exifrOptions = {
        tiff: ExtractorImageExifr.exifrFormatOptions,
        ifd0: ExtractorImageExifr.exifrFormatOptions,
        ifd1: ExtractorImageExifr.exifrFormatOptions,
        exif: ExtractorImageExifr.exifrFormatOptions,
        gps: ExtractorImageExifr.exifrFormatOptions,
        xmp: ExtractorImageExifr.exifrFormatOptions,
        iptc: ExtractorImageExifr.exifrFormatOptions,
        sanitize: true,
        mergeOutput: true,
    };
}