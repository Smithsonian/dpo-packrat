import { IExtractor, IExtractorResults } from './IExtractor';
import * as LOG from '../utils/logger';
import * as H from '../utils/helpers';
import * as CACHE from '../cache';

import path from 'path';
import { ExifTool, Tags } from 'exiftool-vendored';
import tmp from 'tmp-promise';
import { imageSize } from 'image-size';

const exiftoolRetryLimit: number = 3;

export class ExtractorImageExiftool implements IExtractor  {
    static exiftool: ExifTool = new ExifTool();
    static exiftoolInit: boolean = false;

    async initialize(): Promise<IExtractorResults> {
        return await this.initializeExiftools();
    }

    fileTypeHandled(fileName: string): boolean {
        const extension: string = path.extname(fileName).toLowerCase();
        return ExifToolExtensions.has(extension);
    }

    async extractMetadata(fileName: string, inputStream?: NodeJS.ReadableStream | undefined): Promise<IExtractorResults> {
        // LOG.info(`ExtractorImageExiftool.extractMetadata(${fileName}, ${inputStream ? 'with stream' : 'without stream'})`, LOG.LS.eMETA);
        const metadata: Map<string, string> = new Map<string, string>();  // Map of metadata name -> value
        let tempFile: tmp.FileResult | null = null;
        for (let retryCount: number = 0; retryCount < exiftoolRetryLimit; retryCount++) {
            try {
                let fileNameToParse: string = fileName;
                if (inputStream) {
                    const extension: string = path.extname(fileName);
                    tempFile = await tmp.file({ mode: 0o666, postfix: extension });

                    const results: H.IOResults = await H.Helpers.writeStreamToFile(inputStream, tempFile.path); /* istanbul ignore next */
                    if (!results.success) {
                        LOG.error(`ExtractorImageExiftool.extractMetadata unable to create temp file ${tempFile.path}: ${results.error}`, LOG.LS.eMETA);
                        return results;
                    }
                    fileNameToParse = tempFile.path;
                }

                const extractions: Tags | null = await ExtractorImageExiftool.exiftool.read(fileNameToParse); // istanbul ignore next
                if (extractions.errors && extractions.errors.length > 0)
                    LOG.info(`ExtractorImageExiftool.extractMetadata encountered issues: ${JSON.stringify(extractions.errors)}`, LOG.LS.eMETA);

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

                    if (metadata.has(name))
                        LOG.info(`ExtractorImageExiftool.extractMetadata already has value for ${name}`, LOG.LS.eMETA);
                    metadata.set(name, value);
                }

                // If our exif/iptc/jfif info does not contain height & width, calculate that directly using image-size:
                /* istanbul ignore next */
                if (!metadata.has('ImageHeight') || !metadata.has('ImageWidth')) {
                    const dimensions = imageSize(fileNameToParse);
                    if (dimensions.height)
                        metadata.set('ImageHeight', dimensions.height.toString());
                    if (dimensions.width)
                        metadata.set('ImageWidth', dimensions.width.toString());
                }

                return { success: true, error: '', metadata };
            } catch (err) /* istanbul ignore next */ {
                const res: H.IOResults = await this.handleExiftoolException(err);
                if (!res.success)
                    return res;
            } finally {
                if (tempFile)
                    await tempFile.cleanup();
            }

        }
        return { success: false, error: 'ExtractorImageExiftool.extractMetadata failed' };
    }

    eMetadataSource(): CACHE.eVocabularyID | null {
        return CACHE.eVocabularyID.eMetadataMetadataSourceImage;
    }

    private async initializeExiftools(): Promise<IExtractorResults> {
        for (let retryCount: number = 0; retryCount < exiftoolRetryLimit; retryCount++) {
            try {
                if (!ExtractorImageExiftool.exiftoolInit) {
                    const exiftoolVersion: string = await ExtractorImageExiftool.exiftool.version();
                    LOG.info(`ExtractorImageExiftool.extractMetadata using exiftool version ${exiftoolVersion}`, LOG.LS.eMETA);
                    ExtractorImageExiftool.exiftoolInit = true;
                }
                break;
            } catch (err) {
                const res: IExtractorResults = await this.handleExiftoolException(err);
                if (!res.success)
                    return res;
            }
        }
        return { success: true, error: '' };
    }

    private async handleExiftoolException(err: Error): Promise<IExtractorResults> {
        const error: string = 'ExtractorImageExiftool exiftool exception';
        LOG.error(error, LOG.LS.eMETA, err);

        const errMessage: string = H.Helpers.safeString(err.message) ?? '';
        if (errMessage.indexOf('BatchCluster has ended, cannot enqueue') >= -1) {
            LOG.info('ExtractorImageExiftool.handleExiftoolException restarting exiftool', LOG.LS.eMETA);
            await ExtractorImageExiftool.exiftool.end();
            ExtractorImageExiftool.exiftool = new ExifTool();
            return { success: true, error }; // true -> retry
        } else
            return { success: false, error };
    }
}

// List below taken from https://exiftool.org/#supported on 8/4/2021
const ExifToolExtensions: Set<string> = new Set<string>([
    '.360',
    '.3fr',
    '.3g2',
    '.3gp',
    '.3gp2',
    '.3gpp',
    '.aax',
    '.ai',
    '.ait',
    '.arq',
    '.arw',
    '.asf',
    '.avi',
    '.avif',
    '.bpg',
    '.btf',
    '.ciff',
    '.cr2',
    '.cr3',
    '.crm',
    '.crw',
    '.cs1',
    '.dcp',
    '.dcr',
    '.divx',
    '.djv',
    '.djvu',
    '.dng',
    '.doc',
    '.dot',
    '.dvb',
    '.dvr-ms',
    '.eps',
    '.epsf',
    '.erf',
    '.exv',
    '.f4a',
    '.f4b',
    '.f4p',
    '.f4v',
    '.fff',
    '.fla',
    '.flif',
    '.flv',
    '.fpx',
    '.gif',
    '.gpr',
    '.hdp',
    '.heic',
    '.heif',
    '.hif',
    '.icc',
    '.icm',
    '.iiq',
    '.ind',
    '.indd',
    '.indt',
    '.insp',
    '.insv',
    '.inx',
    '.j2c',
    '.j2k',
    '.jng',
    '.jp2',
    '.jpc',
    '.jpe',
    '.jpeg',
    '.jpf',
    '.jpg',
    '.jpm',
    '.jpx',
    '.jxl',
    '.jxr',
    '.k25',
    '.kdc',
    '.la',
    '.lrv',
    '.m4a',
    '.m4b',
    '.m4p',
    '.m4v',
    '.max',
    '.mef',
    '.mie',
    '.mif',
    '.miff',
    '.mng',
    '.mos',
    '.mov',
    '.mp4',
    '.mpo',
    '.mqv',
    '.mrw',
    '.nef',
    '.nrw',
    '.odi',
    '.odp',
    '.ods',
    '.odt',
    '.ofr',
    '.orf',
    '.ori',
    '.pac',
    '.pct',
    '.pdf',
    '.pef',
    '.pict',
    '.png',
    '.pot',
    '.pps',
    '.ppt',
    '.ps',
    '.psb',
    '.psd',
    '.psdt',
    '.qif',
    '.qt',
    '.qti',
    '.qtif',
    '.raf',
    '.raw',
    '.rif',
    '.riff',
    '.rw2',
    '.rwl',
    '.rwz',
    '.sr2',
    '.srf',
    '.srw',
    '.swf',
    '.thm',
    '.tif',
    '.tiff',
    '.vrd',
    '.vsd',
    '.wav',
    '.wdp',
    '.webp',
    '.wma',
    '.wmv',
    '.wv',
    '.x3f',
    '.xcf',
    '.xls',
    '.xlt',
    '.xmp',
]);