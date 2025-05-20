// import * as LOG from '../utils/logger';
// import * as H from '../utils/helpers';
import * as DBAPI from '../db';
import { CacheControl } from './CacheControl';
import * as COMMON from '@dpo-packrat/common';
import { RecordKeeper as RK } from '../records/recordKeeper';

export class LicenseCache {
    private static singleton: LicenseCache | null = null;
    private licenseMap: Map<number, DBAPI.License> = new Map<number, DBAPI.License>(); // map of idLicense -> License
    private licenseEnumMap: Map<COMMON.eLicense, DBAPI.License> = new Map<COMMON.eLicense, DBAPI.License>(); // map of COMMON.eLicense -> License
    private licenseResolverMap: Map<number, DBAPI.LicenseResolver> = new Map<number, DBAPI.LicenseResolver>(); // map of idSystemObject -> LicenseResolver, representing cache of resolved license information

    // **************************
    // Boilerplate Implementation
    // **************************
    private constructor() { }

    private async flushInternal(): Promise<void> {
        for (let nTry: number = 1; nTry <= CacheControl.cacheBuildTries; nTry++) {
            /* istanbul ignore else */
            if (await this.flushInternalWorker())
                break;
        }
    }

    private static async getInstance(): Promise<LicenseCache> {
        if (!LicenseCache.singleton) {
            LicenseCache.singleton = new LicenseCache();
            await LicenseCache.singleton.flushInternal();
        }
        return LicenseCache.singleton;
    }

    // **************************
    // Cache Construction
    // **************************
    private async flushInternalWorker(): Promise<boolean> {
        const LicenseFetch: DBAPI.License[] | null = await DBAPI.License.fetchAll(); /* istanbul ignore next */
        if (!LicenseFetch) {
            RK.logError(RK.LogSection.eCACHE,'flush internal cache failed','unable to fetch licenses',undefined,'Cache.License');
            return false;
        }
        // LOG.info(`LicenseCache LicenseFetch=\n${JSON.stringify(LicenseFetch, H.Helpers.saferStringify)}`, LOG.LS.eCACHE);

        for (const license of LicenseFetch) {
            this.licenseMap.set(license.idLicense, license);
            switch (license.Name.toLowerCase()) {
                case 'cc0, publishable w/ downloads':       this.licenseEnumMap.set(COMMON.eLicense.eViewDownloadCC0, license); break;
                case 'si tou, publishable w/ downloads':    this.licenseEnumMap.set(COMMON.eLicense.eViewDownloadRestriction, license); break;
                case 'si tou, publishable only':            this.licenseEnumMap.set(COMMON.eLicense.eViewOnly, license); break;
                case 'restricted, not publishable':         this.licenseEnumMap.set(COMMON.eLicense.eRestricted, license); break;
            }
        }
        // LOG.info(`LicenseCache publishedStateMap=\n${JSON.stringify(this.publishedStateMap, H.Helpers.saferStringify)}`, LOG.LS.eCACHE);
        RK.logDebug(RK.LogSection.eCACHE,'flush internal cache success',undefined,{ licenses: LicenseFetch.map(i => i.Name) },'Cache.License');
        return true;
    }

    // *************************
    // #region Private Interface
    // *************************
    private async getLicenseInternal(idLicense: number): Promise<DBAPI.License | undefined> {
        let license: DBAPI.License | undefined | null = this.licenseMap.get(idLicense);
        if (!license) /* istanbul ignore next */ { // cache miss, look it up
            license = await DBAPI.License.fetch(idLicense);
            if (license)
                this.licenseMap.set(idLicense, license);
        }
        return license ?? undefined;
    }

    private async getLicenseByEnumInternal(eState: COMMON.eLicense): Promise<DBAPI.License | undefined> {
        return this.licenseEnumMap.get(eState);
    }

    private async getLicenseResolverInternal(idSystemObject: number, OGD?: DBAPI.ObjectGraphDatabase | undefined): Promise<DBAPI.LicenseResolver | undefined> {
        let licenseResolver: DBAPI.LicenseResolver | undefined | null = this.licenseResolverMap.get(idSystemObject);
        if (!licenseResolver) { // cache miss, look it up
            licenseResolver = await DBAPI.LicenseResolver.fetch(idSystemObject, OGD);
            if (licenseResolver)
                this.licenseResolverMap.set(idSystemObject, licenseResolver);
            // LOG.info(`LicenseCache.getLicenseResolverInternal(${idSystemObject}) computed ${JSON.stringify(licenseResolver)}`, LOG.LS.eCACHE);
        } // else
        //     LOG.info(`LicenseCache.getLicenseResolverInternal(${idSystemObject}) from cache ${JSON.stringify(licenseResolver)}`, LOG.LS.eCACHE);
        return licenseResolver ?? undefined;
    }

    private async clearAssignmentInternal(idSystemObject: number): Promise<boolean> {
        // LOG.info(`LicenseCache.clearAssignmentInternal(${idSystemObject})`, LOG.LS.eCACHE);
        // Compute object graph of descendants; remove assignment from each
        const OGD: DBAPI.ObjectGraphDatabase = new DBAPI.ObjectGraphDatabase();
        const OG: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(idSystemObject, DBAPI.eObjectGraphMode.eDescendents, 32, OGD); /* istanbul ignore if */
        if (!await OG.fetch()) {
            RK.logError(RK.LogSection.eCACHE,'clear assignment failed','unable to fetch object graph',{ idSystemObject },'Cache.License');
            return false;
        }

        for (const idSODescendant of OGD.objectMap.keys()) {
            // LOG.info(`LicenseCache.clearAssignmentInternal(${idSystemObject}) cleared ${idSODescendant}`, LOG.LS.eCACHE);
            this.licenseResolverMap.delete(idSODescendant);
        }

        RK.logDebug(RK.LogSection.eCACHE,'clear assignment success',undefined,{ idSystemObject },'Cache.License');
        return true;
    }

    private async setAssignmentInternal(idSystemObject: number, licenseResolver: DBAPI.LicenseResolver): Promise<boolean> {
        // LOG.info(`LicenseCache.setAssignmentInternal(${idSystemObject})`, LOG.LS.eCACHE); /* istanbul ignore if */
        // Compute object graph of descendants; remove assignment from each
        if (!await this.clearAssignmentInternal(idSystemObject)) {
            RK.logError(RK.LogSection.eCACHE,'set assignment failed','cannot clear assignment',{ idSystemObject },'Cache.License');
            return false;
        }

        // Record assignment
        RK.logDebug(RK.LogSection.eCACHE,'set assignment success',undefined,{ idSystemObject, licenseResolver },'Cache.License');
        this.licenseResolverMap.set(idSystemObject, licenseResolver);
        return true;
    }
    // #endregion

    // **************************
    // #region Public Interface
    // **************************
    // #endregion
    /**
     * Fetches license
     * @param idLicense License ID to fetch
     */
    static async getLicense(idLicense: number): Promise<DBAPI.License | undefined> {
        return await (await this.getInstance()).getLicenseInternal(idLicense);
    }

    static async getLicenseByEnum(eState: COMMON.eLicense): Promise<DBAPI.License | undefined> {
        return await (await this.getInstance()).getLicenseByEnumInternal(eState);
    }

    /** If passing in OGD, make sure to compute this navigating through the ancestors of idSystemObject */
    static async getLicenseResolver(idSystemObject: number, OGD?: DBAPI.ObjectGraphDatabase | undefined): Promise<DBAPI.LicenseResolver | undefined> {
        return await (await this.getInstance()).getLicenseResolverInternal(idSystemObject, OGD);
    }

    static async clearAssignment(idSystemObject: number): Promise<boolean> {
        return await (await this.getInstance()).clearAssignmentInternal(idSystemObject);
    }

    static async setAssignment(idSystemObject: number, licenseResolver: DBAPI.LicenseResolver): Promise<boolean> {
        return await (await this.getInstance()).setAssignmentInternal(idSystemObject, licenseResolver);
    }

    static async flush(): Promise<void> {
        LicenseCache.singleton = null;
        await this.getInstance();
    }

    static async clear(): Promise<void> {
        LicenseCache.singleton = null;
    }
}