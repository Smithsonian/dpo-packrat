import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
import { ObjectGraphTestSetup } from './ObjectGraph.setup';

const OGTS: ObjectGraphTestSetup = new ObjectGraphTestSetup();

afterAll(async done => {
    await H.Helpers.sleep(4000);
    done();
});

// *******************************************************************
// DB Composite LicenseResolver
// *******************************************************************
describe('DB Composite LicenseResolver', () => {
    test('DB Object Creation', async () => {
        await OGTS.initialize();
        await OGTS.wire();
    });

    test('LicenseResolver', async () => {
        expect(await OGTS.assignLicenses()).toBeTruthy();
        expect(await fetchLicenseResolver(OGTS.idSOUnit1, false, OGTS.licenseCC0)).toBeTruthy();
        expect(await fetchLicenseResolver(OGTS.idSOUnit2, false, OGTS.licenseCC0)).toBeTruthy();
        expect(await fetchLicenseResolver(OGTS.idSOProject1, false, OGTS.licenseRestricted)).toBeTruthy();
        expect(await fetchLicenseResolver(OGTS.idSOSubject1, false, OGTS.licenseDownload)).toBeTruthy();
        expect(await fetchLicenseResolver(OGTS.idSOSubject2, false, OGTS.licenseView)).toBeTruthy();
        expect(await fetchLicenseResolver(OGTS.idSOSubject4, true, OGTS.licenseRestricted)).toBeTruthy();
        expect(await fetchLicenseResolver(OGTS.idSOItem1, true, OGTS.licenseDownload)).toBeTruthy();
        expect(await fetchLicenseResolver(OGTS.idSOItem2, true, OGTS.licenseDownload)).toBeTruthy();
        expect(await fetchLicenseResolver(OGTS.idSOCaptureData1, false, OGTS.licenseCC0)).toBeTruthy();
        expect(await fetchLicenseResolver(OGTS.idSOCaptureData2, true, OGTS.licenseDownload)).toBeTruthy();
    });

    test('LicenseCache', async () => {
        expect(await CACHE.LicenseCache.getLicenseByPublishedState(DBAPI.ePublishedState.eViewDownloadCC0)).toEqual(OGTS.licenseCC0);
        expect(await CACHE.LicenseCache.getLicenseByPublishedState(DBAPI.ePublishedState.eViewDownloadRestriction)).toEqual(OGTS.licenseDownload);
        expect(await CACHE.LicenseCache.getLicenseByPublishedState(DBAPI.ePublishedState.eViewOnly)).toEqual(OGTS.licenseView);
        expect(await CACHE.LicenseCache.getLicenseByPublishedState(DBAPI.ePublishedState.eRestricted)).toEqual(OGTS.licenseRestricted);
    });
});

async function fetchLicenseResolver(idSystemObject: number, expectInherited: boolean,
    expectedLicense: DBAPI.License | null): Promise<DBAPI.LicenseResolver | null> {
    LOG.info(`fetchLicenseResolver(${idSystemObject}, ${expectInherited}, ${JSON.stringify(expectedLicense)})`, LOG.LS.eTEST);
    const LR1: DBAPI.LicenseResolver | null = await DBAPI.LicenseResolver.fetch(idSystemObject);
    expect(LR1).toBeTruthy();
    if (LR1) {
        expect(LR1.License).toBeTruthy();
        expect(LR1.License).toEqual(expectedLicense);
        expect(LR1.LicenseAssignment).toBeTruthy();
        expect(LR1.inherited).toEqual(expectInherited);
    }

    const LR2: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(idSystemObject);
    expect(LR2).toBeTruthy();
    if (LR2) {
        expect(LR2.License).toBeTruthy();
        expect(LR2.License).toEqual(expectedLicense);
        expect(LR2.LicenseAssignment).toBeTruthy();
        expect(LR2.inherited).toEqual(expectInherited);
    }

    return LR1 && LR2 ? LR1 : null;
}