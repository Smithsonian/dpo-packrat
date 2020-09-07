import fs from 'fs';
import { join } from 'path';
import { ZipStream } from '../../utils/zipStream';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

const mockPath: string = join(__dirname, '../mock/utils/zip/');

afterAll(async done => {
    // jest.setTimeout(5000);
    // await H.Helpers.sleep(2000);
    done();
});

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
        const allEntries: string[] = zip.allEntries;
        const files: string[] = zip.justFiles;
        const dirs: string[] = zip.justDirectories;
        // logStringArray(allEntries, 'ALL   ');
        // logStringArray(files, 'FILES ');
        // logStringArray(dirs, 'DIRS  ');

        expect(allEntries).toEqual(expect.arrayContaining(files.concat(dirs)));
        expect(files.concat(dirs)).toEqual(expect.arrayContaining(allEntries));

        const fileNameValid: string = files.length > 0 ? files[0] : '';
        let readStream: NodeJS.ReadableStream | null = zip.streamContent(fileNameValid);
        expect(readStream).toBeTruthy();
        readStream = zip.streamContent(H.Helpers.randomSlug());
        expect(readStream).toBeFalsy();
    });

    test('ZipStream errors', async () => {
        const path = join(mockPath, 'PackratTest.zip');
        const fileStream = fs.createReadStream(path);
        const zipUnloaded = new ZipStream(fileStream);
        expect(zipUnloaded.justDirectories.length).toEqual(0);

        const readStream: NodeJS.ReadableStream | null = zipUnloaded.streamContent('foobar');
        expect(readStream).toBeFalsy();
    });
});

export function logStringArray(array: string[], prefix: string): void {
    for (const entry of array)
        LOG.logger.info(`${prefix}${entry}`);
}
