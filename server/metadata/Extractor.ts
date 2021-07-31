import * as H from '../utils/helpers';
import * as LOG from '../utils/logger';

import * as path from 'path';
import exifr from 'exifr';
import { imageSize } from 'image-size';
import { pathExists } from 'fs-extra';

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
        try {
            if (!await pathExists(fileName))
                return { success: false, error: `Extractor.extractMetadata could not locate ${fileName}` };
        } catch (err) /* istanbul ignore next */ {
            return { success: false, error: `Extractor.extractMetadata could not locate ${fileName}: ${JSON.stringify(err)}` };
        }

        let results: H.IOResults = { success: true, error: '' };
        const extension: string = path.extname(fileName).toLowerCase();
        switch (extension) { /* istanbul ignore next */
            default: break;

            case '.jpg':
            case '.tif':
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

    private async extractMetadataImage(fileName: string, inputStream?: NodeJS.ReadableStream | undefined): Promise<H.IOResults> {
        try {
            let extractions: any = { }; // eslint-disable-line @typescript-eslint/no-explicit-any
            if (inputStream) {
                const buffer: Buffer | null = await H.Helpers.readFileFromStream(inputStream); /* istanbul ignore next */
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
        } catch (err) /* istanbul ignore next */ {
            return { success: false, error: `Extractor.extractMetadataImage failed: ${JSON.stringify(err, H.Helpers.saferStringify)}` };
        }

        return { success: true, error: '' };
    }
}