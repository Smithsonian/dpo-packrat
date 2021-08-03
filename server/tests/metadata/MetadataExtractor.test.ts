import * as path from 'path';
import * as fs from 'fs';
import * as CACHE from '../../cache';
import * as LOG from '../../utils/logger';
import * as META from '../../metadata';
import * as DBAPI from '../../db';
import * as H from '../../utils/helpers';
import * as UTIL from '../db/api';

const mockPathTurtle: string = path.join(__dirname, '../mock/utils/bagit/PackratTest/data/nmnh_sea_turtle-1_low/camera/');
const mockPathF1991_46: string = path.join(__dirname, '../mock/captures/f1991_46-dataset/camera/'); // eslint-disable-line camelcase
const emitMetadata: boolean = false;
let idVMetadataSource: number | undefined = undefined;
let itemNumber: number = 0;

/*
afterAll(async done => {
    await H.Helpers.sleep(2000);
    done();
});
*/
describe('Metadata Setup', () => {
    test('Setup', async () => {
        idVMetadataSource = await CACHE.VocabularyCache.vocabularyEnumToId(CACHE.eVocabularyID.eMetadataMetadataSourceImage);
        expect(idVMetadataSource).toBeTruthy();
    });

    test('Empty', async () => {
        const extractor: META.MetadataExtractor = new META.MetadataExtractor();
        expect(extractor.metadata.size).toEqual(0);
        expect(await extractor.idVMetadataSource()).toBeUndefined();
    });
});

describe('Metadata: Extractor', () => {
    test('Extractor.extractMetadata file', async () => {
        expect(await extractFromFile('nmnh_sea_turtle-1_low-01.jpg', mockPathTurtle, true)).toBeTruthy();
        expect(await extractFromFile('nmnh_sea_turtle-1_low-02.jpg', mockPathTurtle, true)).toBeTruthy();
        expect(await extractFromFile('nmnh_sea_turtle-1_low-02.ZZZ_UNRECOGNIZED_IMAGE_TYPE', mockPathTurtle, false)).toBeTruthy();

        expect(await extractFromFile('f1991_46-1_low-01.jpg', mockPathF1991_46, true)).toBeTruthy();
        expect(await extractFromFile('f1991_46-1_low-02.jpg', mockPathF1991_46, true)).toBeTruthy();
        expect(await extractFromFile('f1991_46-1_low-03.jpg', mockPathF1991_46, true)).toBeTruthy();
        expect(await extractFromFile('f1991_46-1_low-04.jpg', mockPathF1991_46, true)).toBeTruthy();
        expect(await extractFromFile('f1991_46-1_low-05.jpg', mockPathF1991_46, true)).toBeTruthy();
        expect(await extractFromFile('ZZZ_DOES_NOT_EXIST.tif', mockPathF1991_46, false)).toBeTruthy();
    });

    test('Extractor.extractMetadata stream', async () => {
        expect(await extractFromStream('nmnh_sea_turtle-1_low-01.jpg', mockPathTurtle, true)).toBeTruthy();
        expect(await extractFromStream('nmnh_sea_turtle-1_low-02.jpg', mockPathTurtle, true)).toBeTruthy();

        expect(await extractFromStream('f1991_46-1_low-01.jpg', mockPathF1991_46, true)).toBeTruthy();
        expect(await extractFromStream('f1991_46-1_low-02.jpg', mockPathF1991_46, true)).toBeTruthy();
        expect(await extractFromStream('f1991_46-1_low-03.jpg', mockPathF1991_46, true)).toBeTruthy();
        expect(await extractFromStream('f1991_46-1_low-04.jpg', mockPathF1991_46, true)).toBeTruthy();
        expect(await extractFromStream('f1991_46-1_low-05.jpg', mockPathF1991_46, true)).toBeTruthy();
    });
});

async function extractFromFile(fileName: string, filePath: string, expectSuccess: boolean): Promise<boolean> {
    const extractor: META.MetadataExtractor = new META.MetadataExtractor();
    const results: H.IOResults = await extractor.extractMetadata(path.join(filePath, fileName));
    if (expectSuccess) {
        if (results.success) {
            expect(await extractor.idVMetadataSource()).toEqual(idVMetadataSource);
            expect(validateImageMetadata(extractor, fileName)).toBeTruthy();
            logMetadata(extractor, fileName);
        } else
            LOG.error(`Metadata Extractor.extractMetadata from file failed: ${results.error}`, LOG.LS.eTEST);
    }

    expect(results.success).toEqual(expectSuccess);
    expect(await persistExtractions(extractor)).toBeTruthy();

    extractor.clear();
    return results.success === expectSuccess;
}

async function extractFromStream(fileName: string, filePath: string, expectSuccess: boolean): Promise<boolean> {
    let success: boolean = false;

    try {
        const fullName: string = path.join(filePath, fileName);
        const inputStream: NodeJS.ReadableStream | null = await fs.createReadStream(fullName, { autoClose: true });

        const extractor: META.MetadataExtractor = new META.MetadataExtractor();
        const results: H.IOResults = await extractor.extractMetadata(fullName, inputStream);
        success = results.success;

        if (expectSuccess) {
            if (results.success) {
                expect(await extractor.idVMetadataSource()).toEqual(idVMetadataSource);
                expect(validateImageMetadata(extractor, fileName)).toBeTruthy();
                logMetadata(extractor, fileName);
            } else
                LOG.error(`Metadata Extractor.extractMetadata from stream failed: ${results.error}`, LOG.LS.eTEST);
        }

        expect(results.success).toEqual(expectSuccess);
        extractor.clear();
    } catch (error) {
        success = false;
        if (expectSuccess) {
            LOG.error('Metadata Extractor.extractMetadata from stream failed', LOG.LS.eTEST, error);
            expect(false).toEqual(true);
        }
    }

    return success === expectSuccess;
}

async function persistExtractions(extractor: META.MetadataExtractor): Promise<boolean> {
    const item: DBAPI.Item = await UTIL.createItemTest({
        idAssetThumbnail: null,
        idGeoLocation: null,
        Name: `Test Item ${++itemNumber}`,
        EntireSubject: true,
        idItem: 0
    });
    const SO: DBAPI.SystemObject | null = await item.fetchSystemObject();
    expect(SO).toBeTruthy();

    let results: H.IOResults = await META.MetadataManager.persistExtractor(-1, -1, extractor, null);
    expect(results.success).toEqual(extractor.metadata.size === 0); // should succeed if there is nothing to persist; should fail otherwise due to -1

    if (SO) {
        results = await META.MetadataManager.persistExtractor(SO.idSystemObject, SO.idSystemObject, extractor, null);
        return results.success;
    }

    return false;
}

function validateImageMetadata(extractor: META.MetadataExtractor, fileName: string): boolean {
    expect(extractor.metadata).toBeTruthy();
    let retValue: boolean = true;

    retValue = validationImageMetadataField(extractor, fileName, 'ISO') && retValue;
    retValue = validationImageMetadataField(extractor, fileName, 'Lens') && retValue;
    retValue = validationImageMetadataField(extractor, fileName, 'DateCreated') && retValue;
    retValue = validationImageMetadataField(extractor, fileName, 'FNumber') && retValue;
    retValue = validationImageMetadataField(extractor, fileName, 'ImageHeight') && retValue;
    retValue = validationImageMetadataField(extractor, fileName, 'ImageWidth') && retValue;
    return retValue;
}

function validationImageMetadataField(extractor: META.MetadataExtractor, fileName: string, field: string): boolean {
    if (extractor.metadata.has(field))
        return true;

    LOG.error(`Metadata extraction for ${fileName} missing expected field ${field}`, LOG.LS.eTEST);
    return false;
}

function logMetadata(extractor: META.MetadataExtractor, fileName: string): void {
    if (!emitMetadata)
        return;
    let extract: string = `\nMetadata extract from ${fileName}:`;
    for (const [key, value] of extractor.metadata)
        extract += `\n${key}: ${value}`;
    LOG.info(extract, LOG.LS.eTEST);
}