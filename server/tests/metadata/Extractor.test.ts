import * as path from 'path';
import * as fs from 'fs';
import * as LOG from '../../utils/logger';
import * as META from '../../metadata';
import * as H from '../../utils/helpers';

const mockPathTurtle: string = path.join(__dirname, '../mock/utils/bagit/PackratTest/data/nmnh_sea_turtle-1_low/camera/');
const mockPathF1991_46: string = path.join(__dirname, '../mock/captures/f1991_46-dataset/'); // eslint-disable-line camelcase
const emitMetadata: boolean = false;

afterAll(async done => {
    await H.Helpers.sleep(2000);
    done();
});

describe('Metadata: Extractor', () => {
    test('Extractor.extractMetadata file', async () => {
        expect(await extractFromFile('nmnh_sea_turtle-1_low-01.jpg', mockPathTurtle, true)).toBeTruthy();
        expect(await extractFromFile('nmnh_sea_turtle-1_low-02.jpg', mockPathTurtle, true)).toBeTruthy();
        expect(await extractFromFile('nmnh_sea_turtle-1_low-02.ZZZ_UNRECOGNIZED_IMAGE_TYPE', mockPathTurtle, false)).toBeTruthy();

        expect(await extractFromFile('f1991_46-1_low-01.jpg', path.join(mockPathF1991_46, 'camera'), true)).toBeTruthy();
        expect(await extractFromFile('f1991_46-1_low-02.jpg', path.join(mockPathF1991_46, 'camera'), true)).toBeTruthy();
        expect(await extractFromFile('f1991_46-1_low-03.jpg', path.join(mockPathF1991_46, 'camera'), true)).toBeTruthy();
        expect(await extractFromFile('f1991_46-1_low-04.jpg', path.join(mockPathF1991_46, 'camera'), true)).toBeTruthy();
        expect(await extractFromFile('f1991_46-1_low-05.jpg', path.join(mockPathF1991_46, 'camera'), true)).toBeTruthy();
        expect(await extractFromFile('ZZZ_DOES_NOT_EXIST.tif', path.join(mockPathF1991_46, 'ZZZ_DOES_NOT_EXIST'), false)).toBeTruthy();
    });

    test('Extractor.extractMetadata stream', async () => {
        expect(await extractFromStream('nmnh_sea_turtle-1_low-01.jpg', mockPathTurtle, true)).toBeTruthy();
        expect(await extractFromStream('nmnh_sea_turtle-1_low-02.jpg', mockPathTurtle, true)).toBeTruthy();

        expect(await extractFromStream('f1991_46-1_low-01.jpg', path.join(mockPathF1991_46, 'camera'), true)).toBeTruthy();
        expect(await extractFromStream('f1991_46-1_low-02.jpg', path.join(mockPathF1991_46, 'camera'), true)).toBeTruthy();
        expect(await extractFromStream('f1991_46-1_low-03.jpg', path.join(mockPathF1991_46, 'camera'), true)).toBeTruthy();
        expect(await extractFromStream('f1991_46-1_low-04.jpg', path.join(mockPathF1991_46, 'camera'), true)).toBeTruthy();
        expect(await extractFromStream('f1991_46-1_low-05.jpg', path.join(mockPathF1991_46, 'camera'), true)).toBeTruthy();
        expect(await extractFromStream('ZZZ_DOES_NOT_EXIST.tif', path.join(mockPathF1991_46, 'ZZZ_DOES_NOT_EXIST'), false)).toBeTruthy();
    });
});

async function extractFromFile(fileName: string, filePath: string, expectSuccess: boolean): Promise<boolean> {
    const extractor: META.Extractor = new META.Extractor();
    if (!expectSuccess)
        LOG.info('Metadata Extractor.extractMetadata error that follows is expected!', LOG.LS.eTEST);
    const results: H.IOResults = await extractor.extractMetadata(path.join(filePath, fileName));
    if (expectSuccess) {
        if (results.success)
            expect(validateImageMetadata(extractor, fileName)).toBeTruthy();
        else
            LOG.error(`Metadata Extractor.extractMetadata from file failed: ${results.error}`, LOG.LS.eTEST);
    }

    expect(results.success).toEqual(expectSuccess);
    if (results.success)
        logMetadata(extractor, fileName);

    extractor.clear();
    return results.success === expectSuccess;
}

async function extractFromStream(fileName: string, filePath: string, expectSuccess: boolean): Promise<boolean> {
    let success: boolean = false;

    try {
        const extractor: META.Extractor = new META.Extractor();
        if (!expectSuccess)
            LOG.info('Metadata Extractor.extractMetadata error that follows is expected!', LOG.LS.eTEST);

        const fullName: string = path.join(filePath, fileName);
        const inputStream: NodeJS.ReadableStream = fs.createReadStream(fullName);
        const results: H.IOResults = await extractor.extractMetadata(fullName, inputStream);
        success = results.success;
        if (expectSuccess) {
            if (results.success)
                expect(validateImageMetadata(extractor, fileName)).toBeTruthy();
            else
                LOG.error(`Metadata Extractor.extractMetadata from stream failed: ${results.error}`, LOG.LS.eTEST);
        }

        expect(results.success).toEqual(expectSuccess);
        if (results.success)
            logMetadata(extractor, fileName);

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

function validateImageMetadata(extractor: META.Extractor, fileName: string): boolean {
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

function validationImageMetadataField(extractor: META.Extractor, fileName: string, field: string): boolean {
    if (extractor.metadata.has(field))
        return true;

    LOG.error(`Metadata extraction for ${fileName} missing expected field ${field}`, LOG.LS.eTEST);
    return false;
}

function logMetadata(extractor: META.Extractor, fileName: string): void {
    if (!emitMetadata)
        return;
    let extract: string = `\nMetadata extract from ${fileName}:`;
    for (const [key, value] of extractor.metadata)
        extract += `\n${key}: ${value}`;
    LOG.info(extract, LOG.LS.eTEST);
}