import fs from 'fs';
import { join } from 'path';
import { ZipFile } from '../../utils/zipFile';
import * as H from '../../utils/helpers';
import { getPackratTestFileSizeMap } from './parser/bagitReader.test';

const mockPath: string = join(__dirname, '../mock/utils/zip/');
/*
afterAll(async done => {
    await H.Helpers.sleep(2000);
    done();
});
*/
let zip: ZipFile;

describe('ZipFile', () => {
    test('ZipFile load', async () => {
        const path = join(mockPath, 'PackratTest.zip');
        zip = new ZipFile(path);
        const result: H.IOResults = await zip.load();
        expect(result.success).toBeTruthy();
    });

    test('ZipFile.extract', async () => {
        const allEntries: string[] = await zip.getAllEntries(null);
        const files: string[] = await zip.getJustFiles(null);
        const dirs: string[] = await zip.getJustDirectories(null);
        // logStringArray(allEntries, 'ALL   ');
        // logStringArray(files, 'FILES ');
        // logStringArray(dirs, 'DIRS  ');

        expect(allEntries).toEqual(expect.arrayContaining(files.concat(dirs)));
        expect(files.concat(dirs)).toEqual(expect.arrayContaining(allEntries));

        const fileNameValid: string = files.length > 0 ? files[0] : '';
        let readStream: NodeJS.ReadableStream | null = await zip.streamContent(fileNameValid);
        expect(readStream).toBeTruthy();
        readStream = await zip.streamContent(H.Helpers.randomSlug());
        expect(readStream).toBeFalsy();
    });

    test('ZipFile extract with filter', async () => {
        const all: string[] = await zip.getAllEntries('data');
        const files: string[] = await zip.getJustFiles('data');
        const dirs: string[] = await zip.getJustDirectories('data');

        const expectedFiles: string[] = ['PackratTest/data/nmnh_sea_turtle-1_low/camera/nmnh_sea_turtle-1_low-01.jpg', 'PackratTest/data/nmnh_sea_turtle-1_low/camera/nmnh_sea_turtle-1_low-02.jpg', 'PackratTest/data/nmnh_sea_turtle-1_low/raw/nmnh_sea_turtle-1_low-01.dng', 'PackratTest/data/nmnh_sea_turtle-1_low/raw/nmnh_sea_turtle-1_low-02.dng'];
        const expectedDirs: string[] = ['PackratTest/data/', 'PackratTest/data/nmnh_sea_turtle-1_low/', 'PackratTest/data/nmnh_sea_turtle-1_low/camera/', 'PackratTest/data/nmnh_sea_turtle-1_low/raw/'];
        const expectedAll: string[] = expectedFiles.concat(expectedDirs);
        expect(all).toEqual(expect.arrayContaining(expectedAll));
        expect(files).toEqual(expect.arrayContaining(expectedFiles));
        expect(dirs).toEqual(expect.arrayContaining(expectedDirs));
    });

    test('ZipFile.uncompressedSize', async () => {
        const fileSizeMap: Map<string, number> = getPackratTestFileSizeMap(true);

        for (const entry of await zip.getAllEntries(null)) {
            const observedSize: number | null = await zip.uncompressedSize(entry);
            const expectedSize: number | undefined = fileSizeMap.get(entry);
            // LOG.info(`Examined ${entry}: expected ${expectedSize} vs observed ${observedSize}`, LOG.LS.eTEST);
            expect(observedSize).not.toBeNull();
            expect(expectedSize).not.toBeUndefined();
            expect(observedSize).toEqual(expectedSize);
        }

        const uncompressedSizeRandomName: number | null = await zip.uncompressedSize(H.Helpers.randomSlug());
        expect(uncompressedSizeRandomName).toBeNull();
    });

    test('ZipFile.add expected failure', async () => {
        // expected failure from not-yet implemented 'add'
        const path = join(mockPath, 'PackratTest.zip');
        const zipStream = fs.createReadStream(path);
        const res: H.IOResults = await zip.add('fakey', zipStream);
        expect(res.success).toBeFalsy();
    });

    test('ZipFile.close', async () => {
        let result: H.IOResults = await zip.close();
        expect(result.success).toBeTruthy();

        result = await zip.close();
        expect(result.success).toBeTruthy();

        const uncompressedSizeAterClose: number | null = await zip.uncompressedSize('PackratTest/bagit.txt');
        expect(uncompressedSizeAterClose).toBeNull();
    });

    test('ZipFile errors', async () => {
        const path = join(mockPath, 'PackratTest.zip');
        const zipUnloaded = new ZipFile(path);
        expect((await zipUnloaded.getJustDirectories(null)).length).toEqual(0);

        const readStream: NodeJS.ReadableStream | null = await zipUnloaded.streamContent('foobar');
        expect(readStream).toBeFalsy();

        let result: H.IOResults = await zipUnloaded.close();
        expect(result.success).toBeTruthy();

        const pathNotExist = join(mockPath, H.Helpers.randomSlug());
        const zipNotExist = new ZipFile(pathNotExist);
        result = await zipNotExist.load();
        expect(result.success).toBeFalsy();
    });
});

/*
function logStringArray(array: string[], prefix: string): void {
    for (const entry of array)
        LOG.info(`${prefix}${entry}`, LOG.LS.eTEST);
}
*/