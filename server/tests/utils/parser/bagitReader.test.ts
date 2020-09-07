import fs from 'fs';
import { join } from 'path';
import { BagitReader } from '../../../utils/parser/';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';

const mockPathZip: string = join(__dirname, '../../mock/utils/zip/');
const mockPathDir: string = join(__dirname, '../../mock/utils/bagit/');

afterAll(async done => {
    // jest.setTimeout(5000);
    // await H.Helpers.sleep(2000);
    done();
});

let bagitZip: BagitReader;
let bagitDir: BagitReader;

describe('BagitReader', () => {
    test('BagitReader load from zip with initial validation', async () => {
        const path = join(mockPathZip, 'PackratTest.zip');
        bagitZip = await testBagitLoad({ loadFromZip: true, path, initialValidate: true, subsequentValidate: true, subsequentIsValid: true, expectFailure: false });
    });

    test('BagitReader load from zip without initial validation', async () => {
        const path = join(mockPathZip, 'PackratTest.zip');
        await testBagitLoad({ loadFromZip: true, path, initialValidate: false, subsequentValidate: true, subsequentIsValid: true, expectFailure: false });
    });

    test('BagitReader load from directory initial validation', async () => {
        const path = join(mockPathDir, 'PackratTest');
        bagitDir = await testBagitLoad({ loadFromZip: false, path, initialValidate: true, subsequentValidate: true, subsequentIsValid: true, expectFailure: false });
        await testBagitLoad({ loadFromZip: false, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: true, expectFailure: false }); // second time, without explicit validate()
        expect(await bagitDir.validate()).toBeTruthy();
    });

    test('BagitReader load from directory without initial validation', async () => {
        const path = join(mockPathDir, 'PackratTest');
        await testBagitLoad({ loadFromZip: false, path, initialValidate: false, subsequentValidate: true, subsequentIsValid: true, expectFailure: false });
    });

    test('BagitReader load from zip with multiple hash algorithsm', async () => {
        const path = join(mockPathDir, 'PackratTestValidMultiHash.zip');
        await testBagitLoad({ loadFromZip: true, path, initialValidate: true, subsequentValidate: true, subsequentIsValid: true, expectFailure: false });
    });

    test('BagitReader unvalidated gets', async () => {
        const path = join(mockPathDir, 'PackratTest');
        let bagit: BagitReader = await testBagitLoad({ loadFromZip: false, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: false, expectFailure: false });
        expect((await bagit.getDataFileMap()).size).toBeGreaterThan(0);
        bagit = await testBagitLoad({ loadFromZip: false, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: false, expectFailure: false });
        expect(await bagit.getHashAlgorithm()).toBeTruthy();
    });

    test('BagitReader externally validate contents', async () => {
        expect(await testBagitContents(bagitZip)).toBeTruthy();
        expect(await testBagitContents(bagitDir)).toBeTruthy();
    });

    test('BagitReader failure conditions', async () => {
        let path = join(mockPathDir, 'PackratTest', 'bagit.txt');
        await testBagitLoad({ loadFromZip: true, path, initialValidate: false, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        await testBagitLoad({ loadFromZip: false, path: H.Helpers.randomSlug(), initialValidate: false, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        const bagit: BagitReader = await testBagitLoad({ loadFromZip: false, path: H.Helpers.randomSlug(), initialValidate: false, subsequentValidate: false, subsequentIsValid: false, expectFailure: true });
        expect((await bagit.validate()).success).toBeFalsy();

        path = join(mockPathDir, 'PackratTestInconsistentPrefix.zip');
        await testBagitLoad({ loadFromZip: true, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInconsistentPrefix2.zip');
        await testBagitLoad({ loadFromZip: true, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidAlgorithm.zip');
        await testBagitLoad({ loadFromZip: true, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidAlgorithm2.zip');
        await testBagitLoad({ loadFromZip: true, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidNoBagInfo.zip');
        await testBagitLoad({ loadFromZip: true, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidNoBagit.zip');
        await testBagitLoad({ loadFromZip: true, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidNoManifest.zip');
        await testBagitLoad({ loadFromZip: true, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidNoTagManifest.zip');
        await testBagitLoad({ loadFromZip: true, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidData.zip');
        await testBagitLoad({ loadFromZip: true, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidTagManifest.zip');
        await testBagitLoad({ loadFromZip: true, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidExtraFile.zip');
        await testBagitLoad({ loadFromZip: true, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
        path = join(mockPathDir, 'PackratTestInvalidManifestEntry.zip');
        await testBagitLoad({ loadFromZip: true, path, initialValidate: true, subsequentValidate: false, subsequentIsValid: true, expectFailure: true });
    });
});

type BagitLoadOptions = {
    loadFromZip: boolean;
    path: string;
    initialValidate?: boolean;
    subsequentValidate?: boolean;
    subsequentIsValid?: boolean;
    expectFailure?: boolean;
};

async function testBagitLoad(options: BagitLoadOptions): Promise<BagitReader> {
    const loadFromZip: boolean = options.loadFromZip;
    const path: string = options.path;
    const initialValidate: boolean = options.initialValidate != null ? options.initialValidate : true;
    const subsequentValidate: boolean = options.subsequentValidate != null ? options.subsequentValidate : false;
    const subsequentIsValid: boolean = options.subsequentIsValid != null ? options.subsequentIsValid : true;
    const expectFailure: boolean = options.expectFailure != null ? options.expectFailure : false;

    const bagit: BagitReader = new BagitReader();
    let result: H.IOResults;
    if (loadFromZip) {
        const stream = fs.createReadStream(path);
        result = await bagit.loadFromZipStream(stream, initialValidate);
    } else
        result = await bagit.loadFromDirectory(path, initialValidate);

    if (!result.success) {
        LOG.logger.error(result.error);
        expect(expectFailure).toBeTruthy();
        return bagit;
    }

    if (!initialValidate && subsequentValidate) {
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

        const fileStream: NodeJS.ReadableStream | null = await bagit.getFileStream(file);
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
