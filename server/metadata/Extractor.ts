import * as H from '../utils/helpers';
import * as LOG from '../utils/logger';

import * as path from 'path';
import exifr from 'exifr';

export class MetadataExtract {
    name: string;
    value: string;
    constructor(name: string, value: string) {
        this.name = name;
        this.value = value;
    }
}

export type MetadataCollection = {
    extract: MetadataExtract[];
};

export class Extractor {
    metadata: MetadataExtract[] = [];

    async extractMetadata(fileName: string, inputStream?: NodeJS.ReadableStream | undefined): Promise<H.IOResults> {
        // try image extraction:
        const results: H.IOResults = await this.extractMetadataImage(fileName, inputStream); /* istanbul ignore next */
        if (!results.success)
            LOG.error(`Extractor.extractMetadataImage failed: ${results.error}`, LOG.LS.eMETA);
        return results;
    }

    clear(): void {
        this.metadata = [];
    }

    private async extractMetadataImage(fileName: string, inputStream?: NodeJS.ReadableStream | undefined): Promise<H.IOResults> {
        // Handle image extraction
        const extension: string = path.extname(fileName).toLowerCase();
        switch (extension) {
            default: return { success: true, error: '' };
            case '.jpg':
            case '.tif':
            case '.png':
            case '.heic':
            case '.avif':
            case '.iiq': break;
        }

        const exifrFormatOptions = {
            translateKeys: true,
            translateValues: true,
            reviveValues: true,
            parse: true,
        };

        const exifrOptions = {
            tiff: exifrFormatOptions,
            ifd0: exifrFormatOptions,
            ifd1: exifrFormatOptions,
            exif: exifrFormatOptions,
            gps: exifrFormatOptions,
            xmp: exifrFormatOptions,
            iptc: exifrFormatOptions,
            sanitize: true,
            mergeOutpu: true,
        };

        try {
            let extractions: any = { }; // eslint-disable-line @typescript-eslint/no-explicit-any
            if (inputStream) {
                const buffer: Buffer | null = await H.Helpers.readFileFromStream(inputStream); /* istanbul ignore next */
                if (!buffer) {
                    const error: string = 'Extractor.extractMetadataImage could not load buffer from inputstream';
                    LOG.error(error, LOG.LS.eMETA);
                    return { success: false, error };
                }
                extractions = await exifr.parse(buffer, exifrOptions);
            } else
                extractions = await exifr.parse(fileName, exifrOptions);

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
                    value = String(valueU);
                this.metadata.push(new MetadataExtract(name, value));
            }
        } catch (err) /* istanbul ignore next */ {
            const error: string = `Extractor.extractMetadataImage failed: ${JSON.stringify(err, H.Helpers.saferStringify)}`;
            LOG.error(error, LOG.LS.eMETA);
            return { success: false, error };
        }

        return { success: true, error: '' };
    }
}