import * as H from '../utils/helpers';
import * as LOG from '../utils/logger';

import * as path from 'path';
import exifr from 'exifr';
import { imageSize } from 'image-size';

export class Extractor {
    metadata: Map<string, string> = new Map<string, string>(); // Map of metadata name -> value

    static exifrFormatOptions = {
        translateKeys: true,
        translateValues: true,
        reviveValues: true,
        parse: true,
    };

    static exifrOptions = {
        tiff: Extractor.exifrFormatOptions,
        ifd0: Extractor.exifrFormatOptions,
        ifd1: Extractor.exifrFormatOptions,
        exif: Extractor.exifrFormatOptions,
        gps: Extractor.exifrFormatOptions,
        xmp: Extractor.exifrFormatOptions,
        iptc: Extractor.exifrFormatOptions,
        sanitize: true,
        mergeOutput: true,
    };

    async extractMetadata(fileName: string, inputStream?: NodeJS.ReadableStream | undefined): Promise<H.IOResults> {
        // try image extraction:
        const results: H.IOResults = await this.extractMetadataImage(fileName, inputStream); /* istanbul ignore next */
        if (!results.success)
            LOG.error(`Extractor.extractMetadataImage failed: ${results.error}`, LOG.LS.eMETA);
        return results;
    }

    clear(): void {
        this.metadata.clear();
    }

    private async extractMetadataImage(fileName: string, inputStream?: NodeJS.ReadableStream | undefined): Promise<H.IOResults> {
        // Handle image extraction
        const extension: string = path.extname(fileName).toLowerCase();
        switch (extension) {
            default: return { success: false, error: `Extractor.extractMetadataImage does not support image type ${extension}` };
            case '.jpg':
            case '.tif':
            case '.png':
            case '.heic':
            case '.avif':
            case '.iiq': break;
        }

        try {
            let extractions: any = { }; // eslint-disable-line @typescript-eslint/no-explicit-any
            if (inputStream) {
                const buffer: Buffer | null = await H.Helpers.readFileFromStream(inputStream);
                if (!buffer)
                    return { success: false, error: 'Extractor.extractMetadataImage could not load buffer from inputstream' };
                extractions = await exifr.parse(buffer, Extractor.exifrOptions);
            } else
                extractions = await exifr.parse(fileName, Extractor.exifrOptions);

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
        } catch (err) {
            return { success: false, error: `Extractor.extractMetadataImage failed: ${JSON.stringify(err, H.Helpers.saferStringify)}` };
        }

        return { success: true, error: '' };
    }
}