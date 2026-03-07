/* eslint-disable camelcase */
import { Config } from '../config';
import * as DBAPI from '../db';
import { ASL, LocalStore } from '../utils/localStore';
import { RecordKeeper as RK } from '../records/recordKeeper';

// #region Error Constants
export const AUTH_ERROR = {
    NOT_AUTHENTICATED: 'Authentication required.',
    ACCESS_DENIED: 'You do not have permission to access this resource.',
    PROJECT_DENIED: 'You do not have access to this project.',
    UNIT_DENIED: 'You do not have access to this unit.',
} as const;
// #endregion

// #region AuthorizationContext
/** Precomputed authorization context, cached in session at login and
 *  refreshed in-place when an admin modifies auth assignments. */
export interface AuthorizationContext {
    idUser: number;
    isAdmin: boolean;
    authorizedUnitIds: number[];              // Units the user is assigned to
    authorizedProjectIds: number[];           // Projects the user is explicitly listed on (restricted projects)
    effectiveProjectIds: number[] | null;     // All accessible project IDs; null = all (admin)
    effectiveProjectSOIds: number[] | null;   // Same as above but as SystemObject IDs (for Solr)
    effectiveUnitIds: number[];               // Authorized units + parent units of accessible restricted projects
    effectiveUnitSOIds: number[] | null;      // Effective unit SystemObject IDs (for Solr root filtering); null = all (admin)
    authorizedUnitSOIds: number[] | null;     // Unit SystemObject IDs (for Solr root filtering); null = all (admin) [deprecated: use effectiveUnitSOIds]
}
// #endregion

export class Authorization {

    // #region Context Management

    /**
     * Build authorization context at login time.
     * Result is cached in session and rebuilt in-place by refreshUserSessions()
     * whenever an admin changes unit/project authorization assignments.
     */
    static async buildContext(idUser: number): Promise<AuthorizationContext> {
        const isAdmin = Config.auth.users.admin.includes(idUser);

        if (isAdmin) {
            return {
                idUser, isAdmin,
                authorizedUnitIds: [], authorizedProjectIds: [],
                effectiveProjectIds: null, effectiveProjectSOIds: null,
                effectiveUnitIds: [], effectiveUnitSOIds: null, authorizedUnitSOIds: null
            };
        }

        // Check if user is active
        const user = await DBAPI.User.fetch(idUser);
        if (!user || !user.Active) {
            RK.logInfo(RK.LogSection.eAUTH, 'buildContext for inactive user', undefined, { idUser }, 'Authorization');
            return {
                idUser, isAdmin: false,
                authorizedUnitIds: [], authorizedProjectIds: [],
                effectiveProjectIds: [], effectiveProjectSOIds: [],
                effectiveUnitIds: [], effectiveUnitSOIds: [], authorizedUnitSOIds: []
            };
        }

        // Fetch user's Unit and Project authorizations from UserAuthorization table
        const authorizedUnitIds = await DBAPI.UserAuthorization.fetchUnitsForUser(idUser);
        const authorizedProjectIds = await DBAPI.UserAuthorization.fetchProjectsForUser(idUser);

        // Compute effective project set:
        //   unrestricted Projects in authorized Units + restricted Projects user is listed on
        const unrestrictedProjects = await DBAPI.Project.fetchUnrestrictedByUnits(authorizedUnitIds);
        const restrictedProjects = await DBAPI.Project.fetchRestrictedForUser(idUser);

        const effectiveProjectIds = [
            ...unrestrictedProjects.map(p => p.idProject),
            ...restrictedProjects.map(p => p.idProject)
        ];

        // Compute effective unit set:
        //   directly-assigned units + parent units of accessible restricted projects
        const effectiveUnitIdSet = new Set(authorizedUnitIds);
        for (const project of restrictedProjects) {
            const parentUnitId = await Authorization.getProjectParentUnitId(project.idProject);
            if (parentUnitId !== null)
                effectiveUnitIdSet.add(parentUnitId);
        }
        const effectiveUnitIds = [...effectiveUnitIdSet];

        // Convert to SystemObject IDs for Solr filtering
        const effectiveProjectSOIds = await Authorization.projectIdsToSOIds(effectiveProjectIds);
        const effectiveUnitSOIds = await Authorization.unitIdsToSOIds(effectiveUnitIds);
        const authorizedUnitSOIds = await Authorization.unitIdsToSOIds(authorizedUnitIds);

        RK.logInfo(RK.LogSection.eAUTH, 'buildContext success', undefined, {
            idUser, units: effectiveUnitIds.length, projects: effectiveProjectIds.length
        }, 'Authorization');

        return {
            idUser, isAdmin,
            authorizedUnitIds, authorizedProjectIds,
            effectiveProjectIds, effectiveProjectSOIds,
            effectiveUnitIds, effectiveUnitSOIds, authorizedUnitSOIds
        };
    }

    /**
     * Get cached authorization context from LocalStore.
     * Returns null when no context is available (e.g. unauthenticated request).
     */
    static getContext(): AuthorizationContext | null {
        const LS: LocalStore | undefined = ASL.getStore();
        return LS?.authContext ?? null;
    }

    // #endregion

    // #region Access Checks

    /**
     * Check if user can access a specific Project by idProject.
     * When `surface` is provided, a denial is logged with that label.
     */
    static canAccessProject(ctx: AuthorizationContext, idProject: number, surface?: string): boolean {
        if (ctx.isAdmin) return true;
        if (ctx.effectiveProjectIds === null) return true;
        const allowed = ctx.effectiveProjectIds.includes(idProject);
        if (!allowed && surface)
            Authorization.logProjectDenial(ctx.idUser, idProject, surface);
        return allowed;
    }

    /**
     * Check if user can access a SystemObject by checking its Project ancestry.
     * Uses a single ObjectGraph fetch; falls back to Unit check if no Project ancestor.
     */
    static async canAccessSystemObject(ctx: AuthorizationContext, idSystemObject: number): Promise<boolean> {
        if (ctx.isAdmin) return true;
        if (ctx.effectiveProjectIds === null) return true;

        const OG = new DBAPI.ObjectGraph(idSystemObject, DBAPI.eObjectGraphMode.eAncestors, 32);
        if (!await OG.fetch()) return false;

        // Check project ancestry
        const projectIds = OG.project?.map(p => p.idProject) ?? [];
        if (projectIds.length > 0) {
            const allowed = projectIds.some(pid => (ctx.effectiveProjectIds as number[]).includes(pid));
            if (!allowed)
                Authorization.logDenial(ctx.idUser, idSystemObject, 'canAccessSystemObject');
            return allowed;
        }

        // No project ancestor — fall back to Unit check
        const unitId = OG.unit?.[0]?.idUnit ?? null;
        if (unitId === null) {
            Authorization.logDenial(ctx.idUser, idSystemObject, 'canAccessSystemObject (orphan)');
            return false; // orphan object — deny
        }
        const allowed = ctx.authorizedUnitIds.includes(unitId);
        if (!allowed)
            Authorization.logDenial(ctx.idUser, idSystemObject, 'canAccessSystemObject (unit)');
        return allowed;
    }

    /**
     * Filter a list of projects to only those the user can access.
     */
    static filterProjects(projects: DBAPI.Project[], ctx: AuthorizationContext): DBAPI.Project[] {
        if (ctx.isAdmin || ctx.effectiveProjectIds === null) return projects;
        const idSet = new Set(ctx.effectiveProjectIds);
        return projects.filter(p => idSet.has(p.idProject));
    }

    // #endregion

    // #region ID Conversion Utilities

    /** Get the parent Unit ID for a Project via SystemObjectXref hierarchy. */
    static async getProjectParentUnitId(idProject: number): Promise<number | null> {
        const SO = await DBAPI.SystemObject.fetchFromProjectID(idProject);
        if (!SO) return null;
        const masters = await DBAPI.SystemObjectXref.fetchMasters(SO.idSystemObject);
        if (!masters) return null;
        for (const xref of masters) {
            const masterSO = await DBAPI.SystemObject.fetch(xref.idSystemObjectMaster);
            if (masterSO && masterSO.idUnit !== null)
                return masterSO.idUnit;
        }
        return null;
    }

    /** Convert project IDs to their SystemObject IDs. */
    static async projectIdsToSOIds(projectIds: number[]): Promise<number[]> {
        const soIds: number[] = [];
        for (const idProject of projectIds) {
            const SO = await DBAPI.SystemObject.fetchFromProjectID(idProject);
            if (SO)
                soIds.push(SO.idSystemObject);
        }
        return soIds;
    }

    /** Convert unit IDs to their SystemObject IDs. */
    static async unitIdsToSOIds(unitIds: number[]): Promise<number[]> {
        const soIds: number[] = [];
        for (const idUnit of unitIds) {
            const SO = await DBAPI.SystemObject.fetchFromUnitID(idUnit);
            if (SO)
                soIds.push(SO.idSystemObject);
        }
        return soIds;
    }

    // #endregion

    // #region Orphan Audit

    /**
     * Detect orphaned projects (no Unit ancestor via SystemObjectXref).
     * Logs warnings; does not auto-remediate. Called at startup or by admin.
     */
    static async auditOrphanProjects(): Promise<number[]> {
        const orphanIds: number[] = [];
        const allProjects = await DBAPI.Project.fetchAll();
        if (!allProjects) return orphanIds;

        for (const project of allProjects) {
            const SO = await project.fetchSystemObject();
            if (!SO) {
                RK.logWarning(RK.LogSection.eAUTH, 'orphan project: no SystemObject',
                    undefined, { idProject: project.idProject, name: project.Name }, 'Authorization');
                orphanIds.push(project.idProject);
                continue;
            }

            const masters = await DBAPI.SystemObjectXref.fetchMasters(SO.idSystemObject);
            // Do the async check: find if any master is a Unit
            let foundUnit = false;
            if (masters) {
                for (const xref of masters) {
                    const masterSO = await DBAPI.SystemObject.fetch(xref.idSystemObjectMaster);
                    if (masterSO && masterSO.idUnit !== null) {
                        foundUnit = true;
                        break;
                    }
                }
            }

            if (!foundUnit) {
                RK.logWarning(RK.LogSection.eAUTH, 'orphan project: no Unit ancestor',
                    undefined, { idProject: project.idProject, name: project.Name }, 'Authorization');
                orphanIds.push(project.idProject);
            }
        }

        if (orphanIds.length > 0)
            RK.logWarning(RK.LogSection.eAUTH, `orphan audit complete: ${orphanIds.length} orphan(s)`,
                undefined, { orphanIds }, 'Authorization');

        return orphanIds;
    }

    // #endregion

    // #region Logging

    static logDenial(idUser: number, idSystemObject: number, surface: string): void {
        RK.logWarning(RK.LogSection.eSEC, 'access denied',
            undefined, { idUser, idSystemObject, surface }, 'Authorization');
        Authorization.auditDenial(idUser, idSystemObject, { surface, idSystemObject });
    }

    static logProjectDenial(idUser: number, idProject: number, surface: string): void {
        RK.logWarning(RK.LogSection.eSEC, 'project access denied',
            undefined, { idUser, idProject, surface }, 'Authorization');
        Authorization.auditDenial(idUser, null, { surface, idProject });
    }

    static logUnitDenial(idUser: number, idUnit: number, surface: string): void {
        RK.logWarning(RK.LogSection.eSEC, 'unit access denied',
            undefined, { idUser, idUnit, surface }, 'Authorization');
        Authorization.auditDenial(idUser, null, { surface, idUnit });
    }

    static logFilteredResults(surface: string, totalCount: number, filteredCount: number): void {
        if (totalCount !== filteredCount)
            RK.logDebug(RK.LogSection.eSEC, `${surface}: filtered ${totalCount} → ${filteredCount}`,
                undefined, { surface, totalCount, filteredCount }, 'Authorization');
    }

    private static async auditDenial(idUser: number, idSystemObject: number | null, data: Record<string, unknown>): Promise<void> {
        try {
            const audit = new DBAPI.Audit({
                idAudit: 0,
                idUser,
                AuditDate: new Date(),
                AuditType: DBAPI.eAuditType.eAuthDenied,
                DBObjectType: null,
                idDBObject: null,
                idSystemObject,
                Data: JSON.stringify(data),
            });
            await audit.create();
        } catch (error) { /* best-effort; log failure already handled by Audit.createWorker */ }
    }

    // #endregion
}
