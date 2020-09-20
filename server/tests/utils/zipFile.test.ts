import { join } from 'path';
import { ZipFile } from '../../utils/zipFile';
import * as H from '../../utils/helpers';
// import * as LOG from '../../utils/logger';

const mockPath: string = join(__dirname, '../mock/utils/zip/');
/*
afterAll(async done => {
    jest.setTimeout(5000);
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

    test('ZipFile extract', async () => {
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

        let result: H.IOResults = await zip.close();
        expect(result.success).toBeTruthy();

        result = await zip.close();
        expect(result.success).toBeTruthy();
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
        LOG.logger.info(`${prefix}${entry}`);
}
*/