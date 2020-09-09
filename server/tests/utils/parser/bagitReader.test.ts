import fs from 'fs';
import { join } from 'path';
import { BagitReader, BagitReaderParams } from '../../../utils/parser/';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';

const mockPathZip: string = join(__dirname, '../../mock/utils/zip/');
const mockPathDir: string = join(__dirname, '../../mock/utils/bagit/');

afterAll(async done => {
    // jest.setTimeout(5000);
    // await H.Helpers.sleep(2000);
    done();
});

let bagitZipStream: BagitReader;
let bagitZipFile: BagitReader;
let bagitDir: BagitReader;

describe('BagitReader', () => {
    test('BagitReader load from zip stream with initial validation', async () => {
        const path = join(mockPathZip, 'PackratTest.zip');
        bagitZipStream = await testBagitLoad({ loadMethod: eLoadMethod.eZipStream, path, initialValidate: true, subsequentValidate: true, subsequentIsValid: true, expectFailure: false });
        expect(await bagitZipStream.getAllEntries()).toBeTruthy();
        expect(await bagitZipStream.getJustFiles()).toBeTruthy();
        expect(await bagitZipStream.getJustDirectories()).toBeTruthy();
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
        expect(await bagit.getAllEntries()).toBeTruthy();
        bagit = await testBagitLoad({ loadMethod: eLoadMethod.eDirectory, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: false, expectFailure: false });
        expect(await bagit.getJustFiles()).toBeTruthy();
        bagit = await testBagitLoad({ loadMethod: eLoadMethod.eDirectory, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: false, expectFailure: false });
        expect(await bagit.getJustDirectories()).toBeTruthy();
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
