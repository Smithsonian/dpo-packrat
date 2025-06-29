import { License, LicenseAssignment } from '../..';
import * as CACHE from '../../../cache';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { LicenseResolver } from './LicenseResolver';

/** LicenseManager exists to manage the setting and clearing of license data from system objects. */
export class LicenseManager {
    /** Clears license assignment from idSystemObject by setting LicenseAssignment.DateEnd to now; returns false if clear fails */
    static async clearAssignment(idSystemObject: number, clearAll?: boolean | undefined): Promise<boolean> {
        RK.logInfo(RK.LogSection.eDB,'clear assignmemt',undefined,{ idSystemObject, clearAll },'DB.Composite.License.Manager',true);

        const assignments: LicenseAssignment[] | null = await LicenseAssignment.fetchFromSystemObject(idSystemObject); /* istanbul ignore if */
        if (!assignments)
            return true;

        const now: Date = new Date();
        let retValue: boolean = true;
        for (const licenseAssignment of assignments) {
            if (clearAll || licenseAssignment.assignmentActive()) {     // terminate the assignment either if we're clearing all or the assignment is active ...
                licenseAssignment.DateEnd = now;                        // ... by setting the DateEnd to now
                retValue = await licenseAssignment.update() && retValue;
            }
        }

        return await CACHE.LicenseCache.clearAssignment(idSystemObject) && retValue;
    }

    /** Assigns license to idSystemObject. First clears active, existing licenses */
    static async setAssignment(idSystemObject: number, license: License, idUserCreator?: number | null | undefined,
        DateStart?: Date | null | undefined, DateEnd?: Date | null | undefined): Promise<boolean> {
        /* istanbul ignore if */
        if (!await LicenseManager.clearAssignment(idSystemObject, false)) {
            RK.logError(RK.LogSection.eDB,'set assignment failed','failed to clear active assignments',{ idSystemObject, license },'DB.Composite.License.Manager');
            return false;
        }
        RK.logInfo(RK.LogSection.eDB,'set assignment',undefined,{ idSystemObject, license, idUserCreator, start: DateStart, end: DateEnd },'DB.Composite.License.Manager',true);

        if (!idUserCreator)
            idUserCreator = null;
        if (!DateStart)
            DateStart = null;
        if (!DateEnd)
            DateEnd = null;

        const assignment: LicenseAssignment = new LicenseAssignment({
            idLicense: license.idLicense,
            idUserCreator,
            DateStart,
            DateEnd,
            idSystemObject,
            idLicenseAssignment: 0
        });

        if (!assignment.assignmentActive())
            return true;
        const retValue: boolean = await assignment.create();

        return await CACHE.LicenseCache.setAssignment(idSystemObject, new LicenseResolver(license, assignment, false)) && retValue;
    }
}