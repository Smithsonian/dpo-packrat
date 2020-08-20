// import * as fs from 'fs';
// import { /* PassThrough, */ Stream } from 'stream';
// import * as path from 'path';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

describe('Utils: Helpers', () => {
    test('Utils: Helpers.arraysEqual', () => {
        // Number 1
        // Number 2
        // Arrays of different lengths
        // Arrays of same lengths, different values
        // Arryas of same lengths, same values, different sort
        // Arryas of same lengths, same values, same sort
        const n1: number = 3;
        const n2: number = 5;
        const a1: number[] = [1, 2];
        const a2: number[] = [1, 2, 3];
        const a3: number[] = [1, 2, 4];
        const a4: number[] = [3, 1, 2];
        const a5: number[] = [1, 2, 3];
        const a6: string[] = ['one', 'two', 'three'];
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

    // jest.mock('fs');
    const directoryPath: string = H.Helpers.randomSlug();
    const filePath: string = H.Helpers.randomFilename(directoryPath, '');
    const filePath2: string = H.Helpers.randomFilename(directoryPath, '');
    const filePath3: string = H.Helpers.randomFilename(directoryPath, '');
    const filePath4: string = H.Helpers.randomFilename(directoryPath, '');
    // LOG.logger.info(`directoryPath = ${directoryPath}`);
    // LOG.logger.info(`filePath      = ${filePath}`);
    // LOG.logger.info(`filePath2     = ${filePath2}`);
    // LOG.logger.info(`filePath3     = ${filePath3}`);
    // LOG.logger.info(`filePath4     = ${filePath4}`);

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

    test('Utils: Helpers.createDirectory', () => {
        let res: H.IOResults = H.Helpers.createDirectory(directoryPath);
        expect(res.success).toBeTruthy();
        res = H.Helpers.fileOrDirExists(directoryPath);
        expect(res.success).toBeTruthy();
        res = H.Helpers.createDirectory(directoryPath);
        expect(res.success).toBeTruthy();
    });

    test('Utils: Helpers.ensureFileExists', () => {
        let res: H.IOResults = H.Helpers.ensureFileExists(filePath);
        expect(res.success).toBeTruthy();
        res = H.Helpers.fileOrDirExists(filePath);
        expect(res.success).toBeTruthy();
    });

    test('Utils: Helpers.stat', () => {
        let res: H.StatResults = H.Helpers.stat(filePath);
        expect(res.success).toBeTruthy();
        expect(res.stat).toBeTruthy();
        if (res.stat)
            expect(res.stat.size).toBe(0);

        res = H.Helpers.stat(H.Helpers.randomSlug());
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

    test('Utils: Helpers.copyFile', () => {
        let res: H.IOResults = H.Helpers.copyFile(filePath, filePath2);
        expect(res.success).toBeTruthy();
        LOG.logger.info('NOTICE: The logged error that should follow is expected!');
        res = H.Helpers.copyFile(filePath, filePath2, false);
        expect(res.success).toBeFalsy();
    });

    test('Utils: Helpers.fileExists', () => {
        let res: H.IOResults = H.Helpers.fileOrDirExists(filePath);
        expect(res.success).toBeTruthy();
        res = H.Helpers.fileOrDirExists(filePath2);
        expect(res.success).toBeTruthy();
        res = H.Helpers.fileOrDirExists(filePath3);
        expect(res.success).toBeFalsy();
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

    test('Utils: Helpers.removeFile', () => {
        let res: H.IOResults = H.Helpers.removeFile(filePath);
        expect(res.success).toBeTruthy();
        res = H.Helpers.removeFile(filePath2);
        expect(res.success).toBeTruthy();
        res = H.Helpers.removeFile(filePath3);
        expect(res.success).toBeTruthy();
        res = H.Helpers.removeFile(filePath4);
        expect(res.success).toBeTruthy();            // removing a non-existant file succeeds
    });

    test('Utils: Helpers.removeDirectory', () => {
        let res: H.IOResults = H.Helpers.removeDirectory(filePath);
        expect(res.success).toBeTruthy();    // removing a non-existant directory suceeds
        res = H.Helpers.removeDirectory(directoryPath);
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