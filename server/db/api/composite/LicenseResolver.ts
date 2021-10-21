import { License, LicenseAssignment } from '../..';
import { eObjectGraphMode, ObjectGraph } from './ObjectGraph';
import { ObjectGraphDatabase } from './ObjectGraphDatabase';
import { ObjectGraphDataEntry } from './ObjectGraphDataEntry';
import * as LOG from '../../../utils/logger';

export class LicenseResolver {
    public License: License | null = null;
    public LicenseAssignment: LicenseAssignment | null = null;
    public inherited: boolean = false;

    constructor(License: License, LicenseAssignment: LicenseAssignment, inherited: boolean) {
        this.License = License;
        this.LicenseAssignment = LicenseAssignment;
        this.inherited = inherited;
    }

    public static async fetch(idSystemObject: number, OGD?: ObjectGraphDatabase | undefined): Promise<LicenseResolver | null> {
        const LR: LicenseResolver | null = await LicenseResolver.fetchSpecificLicense(idSystemObject, false);
        if (LR)
            return LR;

        if (!OGD) {
            OGD = new ObjectGraphDatabase();
            const OG: ObjectGraph = new ObjectGraph(idSystemObject, eObjectGraphMode.eAncestors, 32, OGD); /* istanbul ignore if */
            if (!await OG.fetch()) {
                LOG.error(`LicenseResolver unable to fetch object graph for ${idSystemObject}`, LOG.LS.eDB);
                return null;
            }
        }

        return await LicenseResolver.fetchParentsLicense(OGD, idSystemObject, 32, new Map<number, LicenseResolver | null>());
    }

    private static async pickMostRestrictiveLicense(assignments: LicenseAssignment[], inherited: boolean): Promise<LicenseResolver | null> {
        let restrictLevel: number = 0;
        let restrictiveLicense: License | null = null;
        let restrictiveAssignment: LicenseAssignment | null = null;

        for (const assignment of assignments) {
            if (!assignment.assignmentActive()) // only consider active license assignments
                continue;

            const license: License | null = await License.fetch(assignment.idLicense); /* istanbul ignore if */
            if (!license) {
                LOG.error(`LicenseResolver.pickMostRestrictiveAssignment unable to compute license from ${JSON.stringify(assignment)}`, LOG.LS.eDB);
                continue;
            }

            if (restrictLevel < license.RestrictLevel) {
                restrictLevel = license.RestrictLevel;
                restrictiveLicense = license;
                restrictiveAssignment = assignment;
            }
        }
        return (restrictiveLicense && restrictiveAssignment) ? new LicenseResolver(restrictiveLicense, restrictiveAssignment, inherited) : /* istanbul ignore next */ null;
    }

    private static async fetchSpecificLicense(idSystemObject: number, inherited: boolean): Promise<LicenseResolver | null> {
        const assignments: LicenseAssignment[] | null = await LicenseAssignment.fetchFromSystemObject(idSystemObject);
        let LR: LicenseResolver | null = null;
        if (assignments && assignments.length > 0)
            LR = await LicenseResolver.pickMostRestrictiveLicense(assignments, inherited);
        // LOG.info(`LR.fetchSpecificLicense(${idSystemObject}) found ${JSON.stringify(LR)}`, LOG.LS.eDB);
        return LR;
    }

    private static async fetchParentsLicense(OGD: ObjectGraphDatabase, idSystemObject: number, depth: number,
        LRMap: Map<number, LicenseResolver | null>): Promise<LicenseResolver | null> {
        let LR: LicenseResolver | null = null;

        const OGDE: ObjectGraphDataEntry | undefined = OGD.objectMap.get(idSystemObject);
        if (!OGDE) {
            LOG.error(`LicenseResolver unable to fetch object graph data entry from ${idSystemObject}`, LOG.LS.eDB);
            return null;
        }

        for (const idSystemObjectParent of OGDE.parentMap.keys()) {
            // for each parent, get its specific LicenseResolver
            let LRP: LicenseResolver | null | undefined = LRMap.get(idSystemObjectParent);
            if (LRP === undefined) {
                LRP = await LicenseResolver.fetchSpecificLicense(idSystemObjectParent, true);
                if (!LRP || !LRP.License) {  /* istanbul ignore if */
                    // if none, step "up" to the parent, and fetch it's aggregate parents' notion of license, via recursion
                    if (depth <= 0)
                        continue;

                    LRP = await LicenseResolver.fetchParentsLicense(OGD, idSystemObjectParent, depth - 1, LRMap);
                } /* istanbul ignore else */
                LRMap.set(idSystemObjectParent, LRP);
            }

            if (LRP && LRP.License) {
                if (!LR || !LR.License)                                         // if we don't yet have a license, use this one
                    LR = LRP;
                else if (LR.License.RestrictLevel < LRP.License.RestrictLevel)  // otherwise, use this one if it's more restrictive
                    LR = LRP;
                continue;
            }
        }
        // LOG.info(`LR.fetchParentsLicense(${idSystemObject}) found ${JSON.stringify(LR)}, LRMap size = ${LRMap.size}`, LOG.LS.eDB);
        return LR;
    }
}
