import { License, LicenseAssignment } from '../..';
import * as CACHE from '../../../cache';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { LicenseResolver } from './LicenseResolver';

/** Result of a DB-write-core assignment: `success` reflects the DB writes only; `resolver`, when
 * present, is the LicenseResolver the caller should hand to LicenseCache.setAssignment after the
 * enclosing transaction commits. A `success` with no `resolver` means no active assignment was
 * created (the cache is left untouched, matching the prior behavior). */
export type LicenseAssignmentDBResult = {
    success: boolean;
    resolver?: LicenseResolver;
};

/** LicenseManager exists to manage the setting and clearing of license data from system objects.
 *
 * The DB-write core (`*DBWrites`) performs only the LicenseAssignment table writes and never touches
 * the in-memory LicenseCache — which, for a high-hierarchy object, runs a large descendant traversal.
 * Callers that mutate inside an audit transaction use the core and then run the cache maintenance
 * (`maintainCacheAfterSet` / `maintainCacheAfterClear`) AFTER commit, so the heavy descendant walk
 * never extends the transaction lock window (which previously blew the statement timeout and left the
 * cache holding a phantom assignment from a rolled-back transaction). The combined `setAssignment` /
 * `clearAssignment` keep the original DB-then-cache behavior for callers not inside a tight tx. */
export class LicenseManager {
    // ***********************************************************************
    // #region DB-write core (no cache maintenance, no descendant traversal)
    // ***********************************************************************
    /** Terminates license assignments on idSystemObject by setting DateEnd to now (active only, or all
     * when clearAll). DB writes only — does not touch LicenseCache. */
    static async clearAssignmentDBWrites(idSystemObject: number, clearAll?: boolean | undefined): Promise<boolean> {
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

        return retValue;
    }

    /** Clears active assignments then creates the new one on idSystemObject. DB writes only — does not
     * touch LicenseCache. Returns the resolver to feed into maintainCacheAfterSet post-commit. */
    static async setAssignmentDBWrites(idSystemObject: number, license: License, idUserCreator?: number | null | undefined,
        DateStart?: Date | null | undefined, DateEnd?: Date | null | undefined): Promise<LicenseAssignmentDBResult> {
        /* istanbul ignore if */
        if (!await LicenseManager.clearAssignmentDBWrites(idSystemObject, false)) {
            RK.logError(RK.LogSection.eDB,'set assignment failed','failed to clear active assignments',{ idSystemObject, license },'DB.Composite.License.Manager');
            return { success: false };
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

        // A non-active assignment (e.g. DateEnd in the past) is not persisted and leaves the cache
        // unchanged — no resolver is returned.
        if (!assignment.assignmentActive())
            return { success: true };
        if (!await assignment.create())
            return { success: false };

        return { success: true, resolver: new LicenseResolver(license, assignment, false) };
    }
    // #endregion

    // ***********************************************************************
    // #region Post-commit cache maintenance (runs the descendant traversal)
    // ***********************************************************************
    /** Clears every descendant's cached resolver after a license was cleared. Run this AFTER the
     * enclosing transaction commits — never inside it. */
    static async maintainCacheAfterClear(idSystemObject: number): Promise<boolean> {
        return await CACHE.LicenseCache.clearAssignment(idSystemObject);
    }

    /** Clears every descendant's cached resolver and records the new assignment after a license was
     * assigned. Run this AFTER the enclosing transaction commits. A missing resolver (non-active
     * assignment) is a no-op, matching the DB-write core. */
    static async maintainCacheAfterSet(idSystemObject: number, resolver: LicenseResolver | undefined): Promise<boolean> {
        if (!resolver)
            return true;
        return await CACHE.LicenseCache.setAssignment(idSystemObject, resolver);
    }
    // #endregion

    // ***********************************************************************
    // #region Combined DB + cache (for callers not inside a tight transaction)
    // ***********************************************************************
    /** Clears license assignment from idSystemObject and maintains the cache; returns false if clear fails */
    static async clearAssignment(idSystemObject: number, clearAll?: boolean | undefined): Promise<boolean> {
        const dbSuccess: boolean = await LicenseManager.clearAssignmentDBWrites(idSystemObject, clearAll);
        return await LicenseManager.maintainCacheAfterClear(idSystemObject) && dbSuccess;
    }

    /** Assigns license to idSystemObject and maintains the cache. First clears active, existing licenses */
    static async setAssignment(idSystemObject: number, license: License, idUserCreator?: number | null | undefined,
        DateStart?: Date | null | undefined, DateEnd?: Date | null | undefined): Promise<boolean> {
        const dbResult: LicenseAssignmentDBResult = await LicenseManager.setAssignmentDBWrites(idSystemObject, license, idUserCreator, DateStart, DateEnd); /* istanbul ignore if */
        if (!dbResult.success)
            return false;
        return await LicenseManager.maintainCacheAfterSet(idSystemObject, dbResult.resolver);
    }
    // #endregion
}
