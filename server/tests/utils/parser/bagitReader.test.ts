import fs from 'fs';
import { join } from 'path';
import { BagitReader, BagitReaderParams } from '../../../utils/parser/';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';

const mockPathZip: string = join(__dirname, '../../mock/utils/zip/');
const mockPathDir: string = join(__dirname, '../../mock/utils/bagit/');
/*
afterAll(async done => {
    await H.Helpers.sleep(2000);
    done();
});
*/
let bagitZipStream: BagitReader;
let bagitZipFile: BagitReader;
let bagitDir: BagitReader;

describe('BagitReader', () => {
    test('BagitReader load from zip stream with initial validation', async () => {
        const path = join(mockPathZip, 'PackratTest.zip');
        bagitZipStream = await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: true, subsequentValidate: true, subsequentIsValid: true, expectFailure: false });
        expect(await bagitZipStream.getAllEntries(null)).toBeTruthy();
        expect(await bagitZipStream.getJustFiles(null)).toBeTruthy();
        expect(await bagitZipStream.getJustDirectories(null)).toBeTruthy();
    });

    test('BagitReader extract filter', async () => {
        const expectedDirs: string[] = ['nmnh_sea_turtle-1_low/camera', 'nmnh_sea_turtle-1_low/raw'];
        const expectedFiles: string[] = ['nmnh_sea_turtle-1_low-01.jpg', 'nmnh_sea_turtle-1_low-02.jpg', 'nmnh_sea_turtle-1_low-01.dng', 'nmnh_sea_turtle-1_low-02.dng'];
        const expectedAll: string[] = ['PackratTest/data/nmnh_sea_turtle-1_low/camera/nmnh_sea_turtle-1_low-01.jpg', 'PackratTest/data/nmnh_sea_turtle-1_low/camera/nmnh_sea_turtle-1_low-02.jpg', 'PackratTest/data/nmnh_sea_turtle-1_low/raw/nmnh_sea_turtle-1_low-01.dng', 'PackratTest/data/nmnh_sea_turtle-1_low/raw/nmnh_sea_turtle-1_low-02.dng'];

        const observedDirs: string[] = await bagitZipStream.getJustDirectories('nmnh_sea_turtle-1_low/');
        const observedFiles: string[] = await bagitZipStream.getJustFiles('nmnh_sea_turtle-1_low/');
        const observedAll: string[] = await bagitZipStream.getAllEntries('nmnh_sea_turtle-1_low/');
        expect(observedDirs).toEqual(expect.arrayContaining(expectedDirs));
        expect(observedFiles).toEqual(expect.arrayContaining(expectedFiles));
        expect(observedAll).toEqual(expect.arrayContaining(expectedAll));
    });

    test('BagitReader extract filter no match', async () => {
        const randomName: string = H.Helpers.randomSlug();
        const observedDirs2: string[] = await bagitZipStream.getJustDirectories(randomName);
        const observedFiles2: string[] = await bagitZipStream.getJustFiles(randomName);
        const observedAll2: string[] = await bagitZipStream.getAllEntries(randomName);
        expect(observedDirs2).toEqual([]);
        expect(observedFiles2).toEqual([]);
        expect(observedAll2).toEqual([]);
    });

    test('BagitReader.uncompressedSize', async () => {
        const fileSizeMap: Map<string, number> = getPackratTestFileSizeMap(false);
        for (const entry of await bagitZipStream.getAllEntries(null)) {
            const observedSize: number | null = await bagitZipStream.uncompressedSize(entry);
            const expectedSize: number | undefined = fileSizeMap.get(entry);
            LOG.logger.info(`Examined ${entry}: expected ${expectedSize} vs observed ${observedSize}`);
            expect(observedSize).not.toBeNull();
            expect(expectedSize).not.toBeUndefined();
            expect(observedSize).toEqual(expectedSize);
        }

        const uncompressedSizeRandomName: number | null = await bagitZipStream.uncompressedSize(H.Helpers.randomSlug());
        expect(uncompressedSizeRandomName).toBeNull();
    });

    test('BagitReader APIs without initial validation', async () => {
        const path = join(mockPathZip, 'PackratTest.zip');
        const bagitReader1: BagitReader = await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: false, expectFailure: false });
        let sizeResult: number | null = await bagitReader1.uncompressedSize('PackratTest/tagmanifest-sha1.txt');
        expect(sizeResult).toBeTruthy();
        expect(sizeResult).toEqual(229);

        const bagitZipFile1 = await testBagitLoad({ loadMethod: eLoadMethod.eZipFile, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: false, expectFailure: false });
        sizeResult = await bagitZipFile1.uncompressedSize('PackratTest/tagmanifest-sha1.txt');
        expect(sizeResult).toBeTruthy();
        expect(sizeResult).toEqual(229);

        const pathDir = join(mockPathDir, 'PackratTest');
        const bagitDir1 = await testBagitLoad({ loadMethod: eLoadMethod.eDirectory, path: pathDir, initialValidate: false, subsequentValidate: false, subsequentIsValid: false, expectFailure: false });
        sizeResult = await bagitDir1.uncompressedSize('tagmanifest-sha1.txt');
        expect(sizeResult).toBeTruthy();
        expect(sizeResult).toEqual(229);

        const bagitReader2: BagitReader = await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: false, expectFailure: false });
        const stream: NodeJS.ReadableStream | null = await bagitReader2.streamContent('PackratTest/tagmanifest-sha1.txt');
        expect(stream).toBeTruthy();
    });

    test('BagitReader load from zip stream without initial validation', async () => {
        const path = join(mockPathZip, 'PackratTest.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: false, subsequentValidate: true, subsequentIsValid: true, expectFailure: false });
    });

    test('BagitReader load from zip file with initial validation', async () => {
        const path = join(mockPathZip, 'PackratTest.zip');
        bagitZipFile = await testBagitLoad({ loadMethod: eLoadMethod.eZipFile, path, initialValidate: true, subsequentValidate: true, subsequentIsValid: true, expectFailure: false });
    });

    test('BagitReader load from zip file without initial validation', async () => {
        const path = join(mockPathZip, 'PackratTest.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipFile, path, initialValidate: false, subsequentValidate: true, subsequentIsValid: true, expectFailure: false });
    });

    test('BagitReader load from directory initial validation', async () => {
        const path = join(mockPathDir, 'PackratTest');
        bagitDir = await testBagitLoad({ loadMethod: eLoadMethod.eDirectory, path, initialValidate: true, subsequentValidate: true, subsequentIsValid: true, expectFailure: false });
        await testBagitLoad({ loadMethod: eLoadMethod.eDirectory, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: true, expectFailure: false }); // second time, without explicit validate()
        expect(await bagitDir.validate()).toBeTruthy();
    });

    test('BagitReader load from directory without initial validation', async () => {
        const path = join(mockPathDir, 'PackratTest');
        await testBagitLoad({ loadMethod: eLoadMethod.eDirectory, path, initialValidate: false, subsequentValidate: true, subsequentIsValid: true, expectFailure: false });
    });

    test('BagitReader load from zip with multiple hash algorithsm', async () => {
        const path = join(mockPathDir, 'PackratTestValidMultiHash.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: true, subsequentValidate: true, subsequentIsValid: true, expectFailure: false });
    });

    test('BagitReader unvalidated gets', async () => {
        const path = join(mockPathDir, 'PackratTest');
        let bagit: BagitReader = await testBagitLoad({ loadMethod: eLoadMethod.eDirectory, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: false, expectFailure: false });
        expect((await bagit.getDataFileMap()).size).toBeGreaterThan(0);
        bagit = await testBagitLoad({ loadMethod: eLoadMethod.eDirectory, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: false, expectFailure: false });
        expect(await bagit.getHashAlgorithm()).toBeTruthy();
        bagit = await testBagitLoad({ loadMethod: eLoadMethod.eDirectory, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: false, expectFailure: false });
        expect(await bagit.getAllEntries(null)).toBeTruthy();
        bagit = await testBagitLoad({ loadMethod: eLoadMethod.eDirectory, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: false, expectFailure: false });
        expect(await bagit.getJustFiles(null)).toBeTruthy();
        bagit = await testBagitLoad({ loadMethod: eLoadMethod.eDirectory, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: false, expectFailure: false });
        expect(await bagit.getJustDirectories(null)).toBeTruthy();
    });

    test('BagitReader externally validate contents', async () => {
        expect(await testBagitContents(bagitZipStream)).toBeTruthy();
        expect(await testBagitContents(bagitZipFile)).toBeTruthy();
        expect(await testBagitContents(bagitDir)).toBeTruthy();
    });

    test('BagitReader.close', async () => {
        expect(await testBagitClose(bagitZipStream)).toBeTruthy();
        expect(await testBagitClose(bagitZipFile)).toBeTruthy();
        expect(await testBagitClose(bagitDir)).toBeTruthy();
    });

    test('BagitReader failure conditions', async () => {
        let path = join(mockPathDir, 'PackratTest', 'bagit.txt');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path: H.Helpers.randomSlug(), initialValidate: false, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        await testBagitLoad({ loadMethod: eLoadMethod.eZipFile, path: H.Helpers.randomSlug(), initialValidate: false, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        await testBagitLoad({ loadMethod: eLoadMethod.eDirectory, path: H.Helpers.randomSlug(), initialValidate: false, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        const bagit: BagitReader = await testBagitLoad({ loadMethod: eLoadMethod.eDirectory, path: H.Helpers.randomSlug(), initialValidate: false, subsequentValidate: false, subsequentIsValid: false, expectFailure: true });
        expect((await bagit.validate()).success).toBeFalsy();

        path = join(mockPathDir, 'PackratTestInconsistentPrefix.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInconsistentPrefix2.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidAlgorithm.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidAlgorithm2.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidNoBagInfo.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidNoBagit.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidNoManifest.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidNoTagManifest.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidData.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidTagManifest.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidExtraFile.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidManifestEntry.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidManifestEntry.zip');
        await testBagitLoad({ loadMethod: eLoadMethod.eError, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
    });
});

enum eLoadMethod {
    eZipStream,
    eZipFile,
    eDirectory,
    eError
}

type BagitLoadOptions = {
    loadMethod: eLoadMethod;
    path: string;
    initialValidate?: boolean;
    subsequentValidate?: boolean;
    subsequentIsValid?: boolean;
    expectFailure?: boolean;
};

async function testBagitLoad(options: BagitLoadOptions): Promise<BagitReader> {
    const path: string = options.path;
    const validate: boolean = options.initialValidate != null ? options.initialValidate : true;
    const validateContent: boolean = validate;
    const subsequentValidate: boolean = options.subsequentValidate != null ? options.subsequentValidate : false;
    const subsequentIsValid: boolean = options.subsequentIsValid != null ? options.subsequentIsValid : true;
    const expectFailure: boolean = options.expectFailure != null ? options.expectFailure : false;

    let bagitParams: BagitReaderParams;
    switch (options.loadMethod) {
        case eLoadMethod.eZipStream: {
            const zipStream = fs.createReadStream(path);
            bagitParams = { zipFileName: null, zipStream, directory: null, validate, validateContent };
        }   break;
        case eLoadMethod.eZipFile: bagitParams = { zipFileName: path, zipStream: null, directory: null, validate, validateContent }; break;
        case eLoadMethod.eDirectory: bagitParams = { zipFileName: null, zipStream: null, directory: path, validate, validateContent }; break;
        case eLoadMethod.eError: bagitParams = { zipFileName: null, zipStream: null, directory: null, validate, validateContent }; break;
    }
    const bagit: BagitReader = new BagitReader(bagitParams);
    let result: H.IOResults = await bagit.load();

    if (!result.success) {
        LOG.logger.error(result.error);
        expect(expectFailure).toBeTruthy();
        return bagit;
    }

    if (!validate && subsequentValidate) {
        result = await bagit.validate();
        if (!result.success)
            LOG.logger.error(result.error);
        expect(result.success).toBeTruthy();
    }

    if (subsequentIsValid)
        expect(await bagit.getValid()).toBeTruthy();
    return bagit;
}

async function testBagitContents(bagit: BagitReader): Promise<boolean> {
    expect(bagit).toBeTruthy();
    if (!bagit)
        return false;
    const fileMap: Map<string, string> = await bagit.getDataFileMap();
    expect(fileMap.size).toBeGreaterThan(0);

    const algorithm: string = await bagit.getHashAlgorithm();
    expect(algorithm).toBeTruthy();
    if (!algorithm)
        return false;

    let results: boolean = true;
    for (const [file, hash] of fileMap) {
        expect(hash).toBeTruthy();
        if (!hash)
            return false;

        const fileStream: NodeJS.ReadableStream | null = await bagit.streamContent(file);
        expect(fileStream).toBeTruthy();
        if (!fileStream)
            return false;

        const hashResults = await H.Helpers.computeHashFromStream(fileStream, algorithm);
        expect(hashResults.success).toBeTruthy();
        expect(hashResults.hash).toEqual(hash);
        if (hashResults.hash != hash)
            results = false;
    }
    return results;
}

async function testBagitClose(bagit: BagitReader): Promise<boolean> {
    expect(bagit).toBeTruthy();
    if (!bagit)
        return false;
    const results: H.IOResults = await bagit.close();
    expect(results.success).toBeTruthy();
    return results.success;
}

export function getPackratTestFileSizeMap(includeDirs: boolean): Map<string, number> {
    const fileSizeMap: Map<string, number> = new Map<string, number>();
    fileSizeMap.set('PackratTest/bag-info.txt', 0);
    fileSizeMap.set('PackratTest/bagit.txt', 55);
    fileSizeMap.set('PackratTest/capture_data_photo.csv', 1083);
    fileSizeMap.set('PackratTest/data/nmnh_sea_turtle-1_low/camera/nmnh_sea_turtle-1_low-01.jpg', 245862);
    fileSizeMap.set('PackratTest/data/nmnh_sea_turtle-1_low/camera/nmnh_sea_turtle-1_low-02.jpg', 245161);
    fileSizeMap.set('PackratTest/data/nmnh_sea_turtle-1_low/raw/nmnh_sea_turtle-1_low-01.dng', 283616);
    fileSizeMap.set('PackratTest/data/nmnh_sea_turtle-1_low/raw/nmnh_sea_turtle-1_low-02.dng', 282558);
    fileSizeMap.set('PackratTest/manifest-sha1.txt', 410);
    fileSizeMap.set('PackratTest/tagmanifest-sha1.txt', 229);

    if (includeDirs) {
        fileSizeMap.set('PackratTest/data/', 0);
        fileSizeMap.set('PackratTest/data/nmnh_sea_turtle-1_low/', 0);
        fileSizeMap.set('PackratTest/data/nmnh_sea_turtle-1_low/camera/', 0);
        fileSizeMap.set('PackratTest/data/nmnh_sea_turtle-1_low/raw/', 0);
    }
    return fileSizeMap;
}