/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../db';
// import * as H from '../../utils/helpers';
import { LicenseCache } from '../../cache';
// import * as LOG from '../../utils/logger';
/*
afterAll(async done => {
    await H.Helpers.sleep(4000);
    done();
});
*/
enum eCacheTestMode {
    eInitial,
    eClear,
    eFlush
}

const licenseCacheTest = (): void => {
    licenseCacheTestWorker(eCacheTestMode.eInitial);
    licenseCacheTestWorker(eCacheTestMode.eClear);
    licenseCacheTestWorker(eCacheTestMode.eFlush);
    licenseCacheTestClearFlush();
};

function licenseCacheTestWorker(eMode: eCacheTestMode): void {
    let licenseAll: DBAPI.License[] | null = null;

    let description: string = '';
    switch (eMode) {
        case eCacheTestMode.eInitial: description = 'initial'; break;
        case eCacheTestMode.eClear: description = 'post clear'; break;
        case eCacheTestMode.eFlush: description = 'post flush'; break;
    }

    describe('Cache: LicenseCache ' + description, () => {
        test('Cache: LicenseCache Setup ' + description, async () => {
            switch (eMode) {
                case eCacheTestMode.eInitial: break;
                case eCacheTestMode.eClear: await LicenseCache.clear(); break;
                case eCacheTestMode.eFlush: await LicenseCache.flush(); break;
            }

            licenseAll = await DBAPI.License.fetchAll();
            expect(licenseAll).toBeTruthy();
            expect(licenseAll ? licenseAll.length : /* istanbul ignore next */ 0).toBeGreaterThan(0);
        });

        let licenseCC0:        DBAPI.License | null = null;
        let licenseDownload:   DBAPI.License | null = null;
        let licenseView:       DBAPI.License | null = null;
        let licenseRestricted: DBAPI.License | null = null;

        test('Cache: LicenseCache.getLicense ' + description, async () => {
            /* istanbul ignore if */
            if (!licenseAll)
                return;
            for (const license of licenseAll) {
                const licenseInCache: DBAPI.License | undefined = await LicenseCache.getLicense(license.idLicense);
                expect(licenseInCache).toBeTruthy();
                /* istanbul ignore else */
                if (licenseInCache)
                    expect(license).toMatchObject(licenseInCache);
                switch (license.Name.toLowerCase()) {
                    case 'view and download cc0':           licenseCC0 = license; break;
                    case 'view with download restrictions': licenseDownload = license; break;
                    case 'view only':                       licenseView = license; break;
                    case 'restricted':                      licenseRestricted = license; break;
                }
            }

            expect(await LicenseCache.getLicense(-1)).toBeUndefined();
            expect(await LicenseCache.getLicenseByEnum(-1)).toBeUndefined();
            expect(await LicenseCache.getLicenseResolver(-1)).toBeUndefined();
            expect(await LicenseCache.clearAssignment(-1)).toBeTruthy();
            if (licenseCC0)
                await testBogusAssignment(licenseCC0);
        });

        test('Cache: LicenseCache.getLicenseByPublishedState ' + description, async () => {
            expect(await LicenseCache.getLicenseByEnum(DBAPI.eLicense.eViewDownloadCC0)).toEqual(licenseCC0);
            expect(await LicenseCache.getLicenseByEnum(DBAPI.eLicense.eViewDownloadRestriction)).toEqual(licenseDownload);
            expect(await LicenseCache.getLicenseByEnum(DBAPI.eLicense.eViewOnly)).toEqual(licenseView);
            expect(await LicenseCache.getLicenseByEnum(DBAPI.eLicense.eRestricted)).toEqual(licenseRestricted);
        });
    });
}

function licenseCacheTestClearFlush(): void {
    describe('Cache: LicenseCache clear/flush', () => {
        test('Cache: LicenseCache.clear and LicenseCache.flush', async () => {
            await LicenseCache.clear();
            await LicenseCache.flush();
        });
    });
}

async function testBogusAssignment(license: DBAPI.License): Promise<void> {
    const assignment: DBAPI.LicenseAssignment = new DBAPI.LicenseAssignment({
        idLicense: -1,
        idUserCreator: 0,
        DateStart: null,
        DateEnd: null,
        idSystemObject: 0,
        idLicenseAssignment: 0
    });

    expect(await LicenseCache.setAssignment(-1, new DBAPI.LicenseResolver(license, assignment, false))).toBeTruthy();
}

export default licenseCacheTest;
