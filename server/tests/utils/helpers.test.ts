import * as path from 'path';
// import { /* PassThrough */ } from 'stream';
import * as fs from 'fs';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import * as T from '../../utils/types';

const n1: number = 3;
const n2: number = 5;
const a1: number[] = [1, 2];
const a2: number[] = [1, 2, 3];
const a3: number[] = [1, 2, 4];
const a4: number[] = [3, 1, 2];
const a5: number[] = [1, 2, 3];
const a6: string[] = ['one', 'two', 'three'];
const RANDOM_FILE_SIZE: number = 10000;

/*
afterAll(async done => {
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
    const filePathRandom2: string = H.Helpers.randomFilename(directoryPath, '');
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
            dabba: 'doo',
            dabbaOrig: 'doo-dee'
        };
        const res1: H.HashResults = await H.Helpers.writeJsonAndComputeHash(filePath5, obj, 'sha512');
        expect(res1.success).toBeTruthy();
        const res2: H.HashResults = await H.Helpers.computeHashFromFile(filePath5, 'sha512');
        expect(res2.success).toBeTruthy();
        expect(res1.hash).toEqual(res2.hash);

        const res3: H.HashResults = await H.Helpers.writeJsonAndComputeHash(filePath5, obj, 'sha512', H.Helpers.stringifyDatabaseRow);
        expect(res3.success).toBeTruthy();
        const res4: H.HashResults = await H.Helpers.computeHashFromFile(filePath5, 'sha512');
        expect(res4.success).toBeTruthy();
        expect(res3.hash).toEqual(res4.hash);
    });

    test('Utils: Helpers.copyFile', async () => {
        let res: H.IOResults = await H.Helpers.copyFile(filePath, filePath2);
        expect(res.success).toBeTruthy();
        LOG.info('NOTICE: The logged error that should follow is expected!', LOG.LS.eTEST);
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
            const hash: string = await H.Helpers.createRandomFile(WS, RANDOM_FILE_SIZE);
            expect(hash).toBeTruthy();
        } catch (error) {
            LOG.error(`Helpers.createRandomeFile test failed: ${JSON.stringify(error)}`, LOG.LS.eTEST);
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

        const stream4: NodeJS.ReadableStream = fs.createReadStream(filePathRandom);
        const buffer4: Buffer | null = await H.Helpers.readFileFromStreamThrowErrors(stream4);
        expect(buffer4).toBeTruthy();
    });

    test('Utils: Helpers.writeStreamToFile', async () => {
        const stream: NodeJS.ReadableStream = fs.createReadStream(filePathRandom);
        const results: H.IOResults = await H.Helpers.writeStreamToFile(stream, filePathRandom2);
        expect(results.success).toBeTruthy();

        const statResults: H.StatResults = await H.Helpers.stat(filePathRandom2);
        expect(statResults.success).toBeTruthy();
        expect(statResults.stat).toBeTruthy();
        if (statResults.stat)
            expect(statResults.stat.size).toBe(RANDOM_FILE_SIZE);
    });

    test('Utils: Helpers.writeFileToStream', async () => {
        const filePathTemp: string = H.Helpers.randomFilename(directoryPath, '');
        const stream: NodeJS.WritableStream = fs.createWriteStream(filePathTemp);
        let ioResults: H.IOResults = await H.Helpers.writeFileToStream(filePath, stream);
        if (!ioResults.success)
            LOG.info(ioResults.error, LOG.LS.eTEST);
        expect(ioResults.success).toBeTruthy();

        ioResults = await H.Helpers.removeFile(filePathTemp);
        expect(ioResults.success).toBeTruthy();
    });

    test('Utils: Helpers.writeStreamToStream, waitOnEnd = false', async () => {
        const filePathTemp: string = H.Helpers.randomFilename(directoryPath, '');
        const writeStream: NodeJS.WritableStream = fs.createWriteStream(filePathTemp);
        const readStream: NodeJS.ReadableStream = fs.createReadStream(filePath);

        let ioResults: H.IOResults = await H.Helpers.writeStreamToStream(readStream, writeStream);
        if (!ioResults.success)
            LOG.info(ioResults.error, LOG.LS.eTEST);
        expect(ioResults.success).toBeTruthy();

        ioResults = await H.Helpers.removeFile(filePathTemp);
        expect(ioResults.success).toBeTruthy();
    });

    test('Utils: Helpers.writeStreamToStreamComputeSize', async () => {
        const filePathTemp: string = H.Helpers.randomFilename(directoryPath, '');
        const writeStream: NodeJS.WritableStream = fs.createWriteStream(filePathTemp);
        const readStream: NodeJS.ReadableStream = fs.createReadStream(filePathRandom);

        const ioResultsSized: H.IOResultsSized = await H.Helpers.writeStreamToStreamComputeSize(readStream, writeStream);
        if (!ioResultsSized.success)
            LOG.info(ioResultsSized.error, LOG.LS.eTEST);
        expect(ioResultsSized.success).toBeTruthy();
        expect(ioResultsSized.size).toEqual(RANDOM_FILE_SIZE);

        const ioResults: H.IOResults = await H.Helpers.removeFile(filePathTemp);
        expect(ioResults.success).toBeTruthy();
    });

    test('Utils: Helpers.computeSizeOfStream', async () => {
        const stream: NodeJS.ReadableStream = fs.createReadStream(filePathRandom);
        const fileSize: number | null = await H.Helpers.computeSizeOfStream(stream);
        expect(fileSize).toBeTruthy();
        expect(fileSize).toEqual(RANDOM_FILE_SIZE);
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
        res = await H.Helpers.removeFile(filePathRandom2);
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

    test('Utils: Helpers.convertStringToDate', async () => {
        let date: Date | null = H.Helpers.convertStringToDate('2020-01-01');
        expect(date).toBeTruthy();
        if (date) {
            expect(date.getUTCFullYear()).toEqual(2020);
            expect(date.getUTCMonth()).toEqual(0);
            expect(date.getUTCDate()).toEqual(1);
        }

        date = H.Helpers.convertStringToDate('foobar');
        expect(date).toBeFalsy();
    });

    test('Utils: Helpers.safeNumber', async () => {
        const nullVal: null = null;
        const numVal: number = 3.14;
        const strVal: string = 'string';
        const boolVal: boolean = false;
        const dateVal: Date = new Date();
        const objVal = {
            foo: 'abba',
            bar: 'dabba'
        };
        expect(H.Helpers.safeNumber(nullVal)).toBeNull();
        expect(H.Helpers.safeNumber(numVal)).toEqual(numVal);
        expect(H.Helpers.safeNumber(strVal)).toBeNaN();
        expect(H.Helpers.safeNumber(boolVal)).toBeNaN();
        expect(H.Helpers.safeNumber(dateVal)).toBeNaN();
        expect(H.Helpers.safeNumber(objVal)).toBeNaN();
    });

    test('Utils: Helpers.safeBoolean', async () => {
        const nullVal: null = null;
        const numVal: number = 3.14;
        const strVal: string = 'string';
        const boolVal: boolean = false;
        const dateVal: Date = new Date();
        const objVal = {
            foo: 'abba',
            bar: 'dabba'
        };
        expect(H.Helpers.safeBoolean(nullVal)).toBeNull();
        expect(H.Helpers.safeBoolean(numVal)).toBeTruthy();
        expect(H.Helpers.safeBoolean(strVal)).toBeTruthy();
        expect(H.Helpers.safeBoolean(boolVal)).toBeFalsy();
        expect(H.Helpers.safeBoolean(true)).toBeTruthy();
        expect(H.Helpers.safeBoolean(dateVal)).toBeTruthy();
        expect(H.Helpers.safeBoolean(objVal)).toBeTruthy();
    });

    test('Utils: Helpers.safeString', async () => {
        const nullVal: null = null;
        const numVal: number = 3.14;
        const strVal: string = 'string';
        const boolVal: boolean = false;
        const dateVal: Date = new Date();
        const objVal = {
            foo: 'abba',
            bar: 'dabba'
        };
        expect(H.Helpers.safeString(nullVal)).toBeNull();
        expect(H.Helpers.safeString(numVal)).toBeNull();
        expect(H.Helpers.safeString(strVal)).toEqual(strVal);
        expect(H.Helpers.safeString(boolVal)).toBeNull();
        expect(H.Helpers.safeString(dateVal)).toBeNull();
        expect(H.Helpers.safeString(objVal)).toBeNull();
    });

    test('Utils: Helpers.safeDate', async () => {
        const nullVal: null = null;
        const numVal: number = 3.14;
        const strVal: string = 'string';
        const boolVal: boolean = false;
        const dateVal: Date = new Date();
        const dateVal2: Date = dateVal;
        dateVal2.setMilliseconds(0);
        const objVal = {
            foo: 'abba',
            bar: 'dabba'
        };
        expect(H.Helpers.safeDate(nullVal)).toBeNull();
        expect(H.Helpers.safeDate(numVal)).toBeNull();
        expect(H.Helpers.safeDate(strVal)).toBeNull();
        expect(H.Helpers.safeDate(boolVal)).toBeNull();
        expect(H.Helpers.safeDate(objVal)).toBeNull();
        expect(H.Helpers.safeDate(dateVal)).toEqual(dateVal);
        expect(H.Helpers.safeDate(dateVal.toUTCString())).toEqual(dateVal2);
    });

    test('Utils: Helpers.stringify*', async () => {
        type testType = {
            map: Map<number, number>,
            bigint: BigInt,
            string: string,
            number: number,
            boolean: boolean,
            valueOrig: number,
        };

        const testData: testType = {
            map: new Map<number, number>(),
            bigint: BigInt(999999999999999),
            string: 'string',
            number: 50,
            boolean: false,
            valueOrig: 39
        };

        const output1: string = JSON.stringify(testData, H.Helpers.saferStringify);
        LOG.info(`output: ${output1}`, LOG.LS.eTEST);
        expect(output1).toEqual('{"map":[],"bigint":"999999999999999","string":"string","number":50,"boolean":false,"valueOrig":39}');

        const output2: string = JSON.stringify(testData, H.Helpers.stringifyDatabaseRow);
        LOG.info(`output: ${output2}`, LOG.LS.eTEST);
        expect(output2).toEqual('{"map":[],"bigint":"999999999999999","string":"string","number":50,"boolean":false}');
    });

    test('Utils: escapeHTMLEntity', async () => {
        expect(H.Helpers.escapeHTMLEntity('ABBA')).toEqual('ABBA');
        expect(H.Helpers.escapeHTMLEntity('AB&BA')).toEqual('AB&amp;BA');
        expect(H.Helpers.escapeHTMLEntity('AB<BA')).toEqual('AB&lt;BA');
        expect(H.Helpers.escapeHTMLEntity('AB>BA')).toEqual('AB&gt;BA');
        expect(H.Helpers.escapeHTMLEntity('AB"BA')).toEqual('AB&quot;BA');
        expect(H.Helpers.escapeHTMLEntity('AB\'BA')).toEqual('AB&#39;BA');
        expect(H.Helpers.escapeHTMLEntity('AB/BA')).toEqual('AB&#x2F;BA');
    });

    test('Utils: computeHref', async () => {
        expect(H.Helpers.computeHref('/path/to/item', 'anchor text')).toEqual('<a href=\'/path/to/item\'>anchor text</a>');
        expect(H.Helpers.computeHref('item', 'anchor text')).toEqual('<a href=\'item\'>anchor text</a>');
        expect(H.Helpers.computeHref('', 'anchor text')).toEqual('anchor text');
    });

    test('Utils: types', async () => {
        expect(T.maybe('ABBA')).toEqual('ABBA');
        expect(T.maybe('')).toEqual('');
        expect(T.maybe(3)).toEqual(3);
        expect(T.maybe(null)).toEqual(null);
        expect(T.maybe(undefined)).toEqual(null);

        expect(T.maybeString('ABBA')).toEqual('ABBA');
        expect(T.maybeString('')).toEqual('');
        expect(T.maybeString(3)).toEqual(null);
        expect(T.maybeString(null)).toEqual(null);
        expect(T.maybeString(undefined)).toEqual(null);
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