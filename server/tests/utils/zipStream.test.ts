import fs from 'fs';
import * as path from 'path';
import { ZipStream } from '../../utils/zipStream';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK  } from '../../records/recordKeeper';
import { getPackratTestFileSizeMap } from './parser/bagitReader.test';

const mockPath: string = path.join(__dirname, '../mock/utils/zip/');
/*
afterAll(async done => {
    await H.Helpers.sleep(2000);
    done();
});
*/
let zip: ZipStream;
let zipAdd: ZipStream;

describe('ZipStream', () => {
    test('ZipStream load', async () => {
        const filePath: string = path.join(mockPath, 'PackratTest.zip');
        const fileStream = fs.createReadStream(filePath);
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
            RK.logInfo(RK.LogSection.eTEST,'uncompressed size',`Examined ${entry}: expected ${expectedSize} vs observed ${observedSize}`,{},'Tests.Utils.ZipStream');
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
        const filePath: string = path.join(mockPath, 'PackratTest.zip');
        const fileStream = fs.createReadStream(filePath);
        const zipUnloaded = new ZipStream(fileStream);
        expect((await zipUnloaded.getJustDirectories(null)).length).toEqual(0);

        const readStream: NodeJS.ReadableStream | null = await zipUnloaded.streamContent('foobar');
        expect(readStream).toBeFalsy();

        const result: H.IOResults = await zipUnloaded.close();
        expect(result.success).toBeTruthy();
    });

    test('ZipStream.add', async () => {
        zipAdd = new ZipStream();
        expect((await zipAdd.load()).success).toBeFalsy();  // expected failure loading a zip that hasn't been opened from a stream

        const directoryPath: string = path.join('var', 'test', H.Helpers.randomSlug());
        let res: H.IOResults = await H.Helpers.createDirectory(directoryPath);
        expect(res.success).toBeTruthy();

        const filePathRandom: string = path.join(directoryPath, 'randomSource.txt');
        RK.logInfo(RK.LogSection.eTEST,'add',`zipStream.test creating zip to ${filePathRandom}`,{},'Tests.Utils.ZipStream');

        const WS: NodeJS.WritableStream = fs.createWriteStream(filePathRandom);
        expect(WS).toBeTruthy();
        const hash: string = await H.Helpers.createRandomFile(WS, 10000);
        WS.end();
        expect(hash).toBeTruthy();

        res = await zipAdd.add('random1.txt', fs.createReadStream(filePathRandom));
        expect(res.success).toBeTruthy();
        res = await zipAdd.add('random2.txt', fs.createReadStream(filePathRandom));
        expect(res.success).toBeTruthy();
        res = await zipAdd.add('randomPath/random3.txt', fs.createReadStream(filePathRandom));
        expect(res.success).toBeTruthy();

        expect(await zipAdd.getJustFiles(null)).toEqual(expect.arrayContaining(['random1.txt', 'random2.txt', 'randomPath/random3.txt']));
        expect(await zipAdd.getJustDirectories(null)).toEqual(expect.arrayContaining(['randomPath/']));

        const filePathRandomOutput: string = H.Helpers.randomFilename(directoryPath, '') + '.zip';
        RK.logInfo(RK.LogSection.eTEST,'add',`zipStream.test writing zip to ${filePathRandomOutput}`,{},'Tests.Utils.ZipStream');
        const WSOutput: NodeJS.WritableStream = fs.createWriteStream(filePathRandomOutput);
        expect(WSOutput).toBeTruthy();

        const RS: NodeJS.ReadableStream | null = await zipAdd.streamContent(null);
        expect(RS).toBeTruthy();
        if (RS) {
            res = await H.Helpers.writeStreamToStream(RS, WSOutput);
            expect(res.success).toBeTruthy();
        }
        WSOutput.end();

        res = await H.Helpers.removeDirectory(directoryPath, true);
        expect(res.success).toBeTruthy();
    });
});

export function logStringArray(array: string[], prefix: string): void {
    // for (const entry of array)
    RK.logInfo(RK.LogSection.eTEST,'log string array',undefined,{ prefix, array },'Tests.Utils.ZipStream');
}
