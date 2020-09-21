import fs from 'fs';
import { join } from 'path';
import { ZipStream } from '../../utils/zipStream';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import { getPackratTestFileSizeMap } from './parser/bagitReader.test';

const mockPath: string = join(__dirname, '../mock/utils/zip/');
/*
afterAll(async done => {
    jest.setTimeout(5000);
    await H.Helpers.sleep(2000);
    done();
});
*/
let zip: ZipStream;

describe('ZipStream', () => {
    test('ZipStream load', async () => {
        const path = join(mockPath, 'PackratTest.zip');
        const fileStream = fs.createReadStream(path);
        zip = new ZipStream(fileStream);
        const result: H.IOResults = await zip.load();
        expect(result.success).toBeTruthy();
    });

    test('ZipStream extract', async () => {
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

    test('ZipStream extract with filter', async () => {
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

    test('ZipStream.uncompressedSize', async () => {
        const fileSizeMap: Map<string, number> = getPackratTestFileSizeMap(true);

        for (const entry of await zip.getAllEntries(null)) {
            const observedSize: number | null = await zip.uncompressedSize(entry);
            const expectedSize: number | undefined = fileSizeMap.get(entry);
            LOG.logger.info(`Examined ${entry}: expected ${expectedSize} vs observed ${observedSize}`);
            expect(observedSize).not.toBeNull();
            expect(expectedSize).not.toBeUndefined();
            expect(observedSize).toEqual(expectedSize);
        }

        const uncompressedSizeRandomName: number | null = await zip.uncompressedSize(H.Helpers.randomSlug());
        expect(uncompressedSizeRandomName).toBeNull();
    });

    test('ZipStream.close', async () => {
        let result: H.IOResults = await zip.close();
        expect(result.success).toBeTruthy();

        result = await zip.close();
        expect(result.success).toBeTruthy();

        const uncompressedSizeAterClose: number | null = await zip.uncompressedSize('PackratTest/bagit.txt');
        expect(uncompressedSizeAterClose).toBeNull();
    });

    test('ZipStream errors', async () => {
        const path = join(mockPath, 'PackratTest.zip');
        const fileStream = fs.createReadStream(path);
        const zipUnloaded = new ZipStream(fileStream);
        expect((await zipUnloaded.getJustDirectories(null)).length).toEqual(0);

        const readStream: NodeJS.ReadableStream | null = await zipUnloaded.streamContent('foobar');
        expect(readStream).toBeFalsy();

        const result: H.IOResults = await zipUnloaded.close();
        expect(result.success).toBeTruthy();
    });
});

export function logStringArray(array: string[], prefix: string): void {
    for (const entry of array)
        LOG.logger.info(`${prefix}${entry}`);
}
