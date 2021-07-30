import * as path from 'path';
import * as fs from 'fs';
import * as LOG from '../../utils/logger';
import * as META from '../../metadata';
import * as H from '../../utils/helpers';

const mockPath: string = path.join(__dirname, '../mock/utils/bagit/PackratTest/data/nmnh_sea_turtle-1_low/camera/');

/*
afterAll(async done => {
    await H.Helpers.sleep(2000);
    done();
});
*/
describe('Metadata: Extractor', () => {
    test('Extractor.extractMetadata file', async () => {
        expect(await extractFromFile('nmnh_sea_turtle-1_low-01.jpg', true)).toBeTruthy();
        expect(await extractFromFile('nmnh_sea_turtle-1_low-02.jpg', true)).toBeTruthy();
        expect(await extractFromFile('nmnh_sea_turtle-1_low-02.ZZZ_UNRECOGNIZED_IMAGE_TYPE', true)).toBeTruthy();
    });

    test('Extractor.extractMetadata stream', async () => {
        expect(await extractFromStream('nmnh_sea_turtle-1_low-01.jpg', true)).toBeTruthy();
        expect(await extractFromStream('nmnh_sea_turtle-1_low-02.jpg', true)).toBeTruthy();
    });
});

async function extractFromFile(fileName: string, expectSuccess: boolean): Promise<boolean> {
    const extractor: META.Extractor = new META.Extractor();
    const results: H.IOResults = await extractor.extractMetadata(path.join(mockPath, fileName));
    if (expectSuccess && !results.success)
        LOG.error(`Metadata Extractor.extractMetadata from file failed: ${results.error}`, LOG.LS.eTEST);

    expect(results.success).toEqual(expectSuccess);
    // if (results.success)
    //     logMetadata(extractor, fileName);

    extractor.clear();
    return results.success === expectSuccess;
}

async function extractFromStream(fileName: string, expectSuccess: boolean): Promise<boolean> {
    const filePath: string = path.join(mockPath, fileName);
    let success: boolean = false;

    try {
        const extractor: META.Extractor = new META.Extractor();

        const inputStream: NodeJS.ReadableStream = fs.createReadStream(filePath);
        const results: H.IOResults = await extractor.extractMetadata(fileName, inputStream);
        success = results.success;
        if (expectSuccess && !results.success)
            LOG.error(`Metadata Extractor.extractMetadata from stream failed: ${results.error}`, LOG.LS.eTEST);

        expect(results.success).toEqual(expectSuccess);
        // if (results.success)
        //     logMetadata(extractor, fileName);

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

/*
function logMetadata(extractor: META.Extractor, fileName: string): void {
    let extract: string = `metadata extract from ${fileName}:`;
    for (const metadataExtract of extractor.metadata)
        extract += `\n${metadataExtract.name}: ${metadataExtract.value}`;
    LOG.info(extract, LOG.LS.eTEST);
}
*/