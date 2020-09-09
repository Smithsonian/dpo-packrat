import * as path from 'path';
// import { /* PassThrough */ } from 'stream';
import * as fs from 'fs';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

const n1: number = 3;
const n2: number = 5;
const a1: number[] = [1, 2];
const a2: number[] = [1, 2, 3];
const a3: number[] = [1, 2, 4];
const a4: number[] = [3, 1, 2];
const a5: number[] = [1, 2, 3];
const a6: string[] = ['one', 'two', 'three'];

/*
afterAll(async done => {
    jest.setTimeout(5000);
    await H.Helpers.sleep(2000);
    done();
});
*/
describe('Utils: Helpers', () => {
    test('Utils: Helpers.arraysEqual', () => {
        // Number 1
        // Number 2
        // Arrays of different lengths
        // Arrays of same lengths, different values
        // Arryas of same lengths, same values, different sort
        // Arryas of same lengths, same values, same sort
        expect(H.Helpers.arraysEqual(n1, n1)).toBeFalsy();
        expect(H.Helpers.arraysEqual(n1, n2)).toBeFalsy();
        expect(H.Helpers.arraysEqual(n1, a1)).toBeFalsy();
        expect(H.Helpers.arraysEqual(a1, n1)).toBeFalsy();
        expect(H.Helpers.arraysEqual(a1, a2)).toBeFalsy();
        expect(H.Helpers.arraysEqual(a2, a3)).toBeFalsy();
        expect(H.Helpers.arraysEqual(a2, a4)).toBeTruthy();
        expect(H.Helpers.arraysEqual(a2, a5)).toBeTruthy();
        expect(H.Helpers.arraysEqual(a5, a6)).toBeFalsy();
    });

    test('Utils: Helpers.iterablesEqual', () => {
        expect(H.Helpers.iterablesEqual(a1.values(), a2.values())).toBeFalsy();
        expect(H.Helpers.iterablesEqual(a2.values(), a3.values())).toBeFalsy();
        expect(H.Helpers.iterablesEqual(a2.values(), a4.values())).toBeTruthy();
        expect(H.Helpers.iterablesEqual(a2.values(), a5.values())).toBeTruthy();
        expect(H.Helpers.iterablesEqual(a5.values(), a6.values())).toBeFalsy();
    });

    // jest.mock('fs');
    const directoryPath: string = path.join('var', 'test', H.Helpers.randomSlug());
    const filePath: string = H.Helpers.randomFilename(directoryPath, '');
    const filePath2: string = H.Helpers.randomFilename(directoryPath, '');
    const filePath3: string = H.Helpers.randomFilename(directoryPath, '');
    const filePath4: string = H.Helpers.randomFilename(directoryPath, '');
    const filePath5: string = H.Helpers.randomFilename(directoryPath, '');
    const filePathRandom: string = H.Helpers.randomFilename(directoryPath, '');
    const dirNestEmpty: string = path.join(directoryPath, H.Helpers.randomSlug());
    const dirNestNotEmpty: string = path.join(directoryPath, H.Helpers.randomSlug());

    test('Utils: Helpers.randomSlug', () => {
        const s1: string = H.Helpers.randomSlug();
        const s2: string = H.Helpers.randomSlug();
        expect(s1).toBeTruthy();
        expect(s2).toBeTruthy();
        expect(s1).not.toEqual(s2);
    });

    test('Utils: Helpers.randomFilename', () => {
        const s1: string = H.Helpers.randomFilename('filepath', '');
        const s2: string = H.Helpers.randomFilename('filepath', 'prefix');
        expect(s1).toBeTruthy();
        expect(s2).toBeTruthy();
        expect(s1.substring(0, 8)).toEqual('filepath');
        expect(s2.substring(9, 16)).toEqual('prefix-');
    });

    test('Utils: Helpers.validFilename', () => {
        expect(H.Helpers.validFilename(filePath)).toBeFalsy();
        expect(H.Helpers.validFilename('con')).toBeFalsy();
        expect(H.Helpers.validFilename('com1')).toBeFalsy();
        expect(H.Helpers.validFilename('prn')).toBeFalsy();
        expect(H.Helpers.validFilename('lpt5')).toBeFalsy();
        expect(H.Helpers.validFilename('foo:bar')).toBeFalsy();
        expect(H.Helpers.validFilename('foo/bar')).toBeFalsy();
        expect(H.Helpers.validFilename('foo\\bar')).toBeFalsy();
        expect(H.Helpers.validFilename('foo<bar')).toBeFalsy();
        expect(H.Helpers.validFilename('.lpt5')).toBeTruthy();
    });

    test('Utils: Helpers.createDirectory', async () => {
        let res: H.IOResults = await H.Helpers.createDirectory(directoryPath);
        expect(res.success).toBeTruthy();
        res = await H.Helpers.fileOrDirExists(directoryPath);
        expect(res.success).toBeTruthy();
        res = await H.Helpers.createDirectory(directoryPath);
        expect(res.success).toBeTruthy();
    });

    test('Utils: Helpers.ensureFileExists', async () => {
        let res: H.IOResults = await H.Helpers.ensureFileExists(filePath);
        expect(res.success).toBeTruthy();
        res = await H.Helpers.fileOrDirExists(filePath);
        expect(res.success).toBeTruthy();
    });

    test('Utils: Helpers.stat', async () => {
        let res: H.StatResults = await H.Helpers.stat(filePath);
        expect(res.success).toBeTruthy();
        expect(res.stat).toBeTruthy();
        if (res.stat)
            expect(res.stat.size).toBe(0);

        res = await H.Helpers.stat(H.Helpers.randomSlug());
        expect(res.success).toBeFalsy();
    });

    test('Utils: Helpers.computeHashFromFile', async () => {
        let res: H.HashResults = await H.Helpers.computeHashFromFile(filePath, 'sha512');
        expect(res.success).toBeTruthy();
        expect(res.hash).toBeTruthy();
        // hash of an empty file is always the same:
        expect(res.hash).toBe('cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e');

        res = await H.Helpers.computeHashFromFile(H.Helpers.randomSlug(), 'sha512');
        expect(res.success).toBeFalsy();
    });

    test('Utils: Helpers.computeHashFromString', async () => {
        const toHash: string = '';
        const hash: string = H.Helpers.computeHashFromString(toHash, 'sha512');
        expect(hash).toBe('cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e');
    });

    test('Utils: Helpers.writeJsonAndComputeHash', async () => {
        const obj = {
            abba: 1,
            dabba: 'doo'
        };
        const res1: H.HashResults = await H.Helpers.writeJsonAndComputeHash(filePath5, obj, 'sha512');
        expect(res1.success).toBeTruthy();
        const res2: H.HashResults = await H.Helpers.computeHashFromFile(filePath5, 'sha512');
        expect(res2.success).toBeTruthy();
        expect(res1.hash).toEqual(res2.hash);
    });

    test('Utils: Helpers.copyFile', async () => {
        let res: H.IOResults = await H.Helpers.copyFile(filePath, filePath2);
        expect(res.success).toBeTruthy();
        LOG.logger.info('NOTICE: The logged error that should follow is expected!');
        res = await H.Helpers.copyFile(filePath, filePath2, false);
        expect(res.success).toBeFalsy();
    });

    test('Utils: Helpers.fileOrDirExists', async () => {
        let res: H.IOResults = await H.Helpers.fileOrDirExists(filePath);
        expect(res.success).toBeTruthy();
        res = await H.Helpers.fileOrDirExists(filePath2);
        expect(res.success).toBeTruthy();
        res = await H.Helpers.fileOrDirExists(filePath3);
        expect(res.success).toBeFalsy();
    });

    test('Utils: Helpers.initializeFile', async () => {
        let res: H.IOResults;
        res = await H.Helpers.initializeFile(filePath5, filePath, 'Destination exists');
        expect(res.success).toBeTruthy();
        res = await H.Helpers.initializeFile(filePath5, filePath4, 'Destination does not exist, source exists');
        expect(res.success).toBeTruthy();
        res = await H.Helpers.removeFile(filePath4);
        expect(res.success).toBeTruthy();
        res = await H.Helpers.initializeFile(null, filePath4, 'Destination does not exist, no source');
        expect(res.success).toBeTruthy();
        res = await H.Helpers.removeFile(filePath4);
        expect(res.success).toBeTruthy();
    });

    test('Utils: Helpers.filesMatch', async () => {
        let res: H.IOResults = await H.Helpers.filesMatch(filePath, filePath3);
        expect(res.success).toBeFalsy();
        res = await H.Helpers.filesMatch(filePath3, filePath);
        expect(res.success).toBeFalsy();
        res = await H.Helpers.filesMatch(filePath2, filePath5);
        expect(res.success).toBeFalsy();
        res = await H.Helpers.filesMatch(filePath, filePath2);
        expect(res.success).toBeTruthy();
    });

    test('Utils: Helpers.createRandomFile', async () => {
        try {
            const WS: NodeJS.WritableStream = fs.createWriteStream(filePathRandom);
            expect(WS).toBeTruthy();
            const hash: string = await H.Helpers.createRandomFile(WS, 10000);
            expect(hash).toBeTruthy();
        } catch (error) {
            LOG.logger.error(`Helpers.createRandomeFile test failed: ${JSON.stringify(error)}`);
            expect(false).toBeTruthy();
        }
    });

    test('Utils: Helpers.readFileFromStream', async () => {
        const stream1: NodeJS.ReadableStream = fs.createReadStream(filePath);
        const buffer1: Buffer | null = await H.Helpers.readFileFromStream(stream1);
        expect(buffer1).toBeTruthy();

        const stream2: NodeJS.ReadableStream = fs.createReadStream(filePath2);
        const buffer2: Buffer | null = await H.Helpers.readFileFromStream(stream2);
        expect(buffer2).toBeTruthy();
        expect(buffer1).toEqual(buffer2);

        const stream3: NodeJS.ReadableStream = fs.createReadStream(filePathRandom);
        const buffer3: Buffer | null = await H.Helpers.readFileFromStream(stream3);
        expect(buffer3).toBeTruthy();
    });

    test('Utils: Helpers.writeFileToStream', async () => {
        const filePathTemp: string = H.Helpers.randomFilename(directoryPath, '');
        const stream: NodeJS.WritableStream = fs.createWriteStream(filePathTemp);
        let ioResults: H.IOResults = await H.Helpers.writeFileToStream(filePath, stream);
        LOG.logger.info(ioResults.error);
        expect(ioResults.success).toBeTruthy();

        ioResults = await H.Helpers.removeFile(filePathTemp);
        expect(ioResults.success).toBeTruthy();
    });

    test('Utils: Helpers.initializeDirectory', async () => {
        let res: H.IOResults = await H.Helpers.initializeDirectory(dirNestEmpty, 'Nested Directory, Empty');
        expect(res.success).toBeTruthy();
        res = await H.Helpers.initializeDirectory(dirNestNotEmpty, 'Nested Directory, Not Empty');
        expect(res.success).toBeTruthy();
        res = await H.Helpers.initializeDirectory(dirNestNotEmpty, 'Nested Directory, Not Empty');
        expect(res.success).toBeTruthy();
    });

    test('Utils: Helpers.moveFile', async () => {
        const moveDest: string = path.join(dirNestNotEmpty, path.basename(filePath5));
        let res: H.IOResults;
        res = await H.Helpers.moveFile(filePath5, moveDest);
        expect(res.success).toBeTruthy();
        res = await H.Helpers.moveFile(moveDest, filePath5);
        expect(res.success).toBeTruthy();
    });

    test('Utils: Helpers.getDirectoryEntriesRecursive', async () => {
        const copiedFile: string = H.Helpers.randomFilename(dirNestNotEmpty, '');
        const res: H.IOResults = await H.Helpers.copyFile(filePath5, copiedFile);
        expect(res.success).toBeTruthy();

        const dirNotRecursive: string[] | null = await H.Helpers.getDirectoryEntriesRecursive(directoryPath, 0);
        expect(dirNotRecursive).toBeTruthy();
        expect(dirNotRecursive).toEqual(expect.arrayContaining([filePath, filePath2, filePath5, filePathRandom]));

        const dirRecursive: string[] | null = await H.Helpers.getDirectoryEntriesRecursive(directoryPath);
        expect(dirRecursive).toBeTruthy();
        expect(dirRecursive).toEqual(expect.arrayContaining([filePath, filePath2, filePath5, filePathRandom, copiedFile]));
    });

    /*
    test('Utils: Helpers.IO File Lock', async () => {
        const RS: fs.ReadStream = fs.createReadStream(filePath2);
        // const mockReadable = new PassThrough();
        await streamToFile(RS, filePath3);

        let res: H.IOResults = H.Helpers.removeFile(filePath2);
        expect(res.success).toBeTruthy();
        res = H.Helpers.copyFile(filePath, filePath2, true);
        expect(res.success).toBeFalsy();
        res = H.Helpers.removeDirectory(directoryPath);
        expect(res.success).toBeFalsy();
        RS.destroy();
    });
    */

    test('Utils: Helpers.removeFile', async () => {
        await H.Helpers.sleep(50);
    });

    test('Utils: Helpers.removeFile', async () => {
        let res: H.IOResults = await H.Helpers.removeFile(filePath);
        expect(res.success).toBeTruthy();
        res = await H.Helpers.removeFile(filePath2);
        expect(res.success).toBeTruthy();
        res = await H.Helpers.removeFile(filePath3);
        expect(res.success).toBeFalsy();
        res = await H.Helpers.removeFile(filePath4);
        expect(res.success).toBeFalsy();
        res = await H.Helpers.removeFile(filePathRandom);
        expect(res.success).toBeTruthy();
    });

    test('Utils: Helpers.removeDirectory', async () => {
        let res: H.IOResults = await H.Helpers.removeDirectory(filePath);
        expect(res.success).toBeFalsy();
        res = await H.Helpers.removeDirectory(directoryPath, false); // removing a non-empty directory fails, when not in recurse mode
        expect(res.success).toBeFalsy();
        res = await H.Helpers.removeDirectory(directoryPath, true);
        expect(res.success).toBeTruthy();
    });
});

/*
const streamToFile = (inputStream: Stream, filePath: string) => {
    return new Promise((resolve, reject) => {
        const fileWriteStream: fs.WriteStream = fs.createWriteStream(filePath);
        inputStream
            .pipe(fileWriteStream)
            .on('finish', resolve)
            .on('error', reject);
    });
};
*/