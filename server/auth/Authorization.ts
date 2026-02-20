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
/** Precomputed authorization context, cached in session at login. */
export interface AuthorizationContext {
    idUser: number;
    isAdmin: boolean;
    authorizedUnitIds: number[];              // Units the user is assigned to
    authorizedProjectIds: number[];           // Projects the user is explicitly listed on (restricted projects)
    effectiveProjectIds: number[] | null;     // All accessible project IDs; null = all (admin)
    effectiveProjectSOIds: number[] | null;   // Same as above but as SystemObject IDs (for Solr)
    authorizedUnitSOIds: number[] | null;     // Unit SystemObject IDs (for Solr root filtering); null = all (admin)
}
// #endregion

export class Authorization {

    // #region Context Management

    /**
     * Build authorization context at login time.
     * Called once per login, result is cached in session.
     */
    static async buildContext(idUser: number): Promise<AuthorizationContext> {
        const isAdmin = Config.auth.users.admin.includes(idUser);

        if (isAdmin) {
            return {
                idUser, isAdmin,
                authorizedUnitIds: [], authorizedProjectIds: [],
                effectiveProjectIds: null, effectiveProjectSOIds: null, authorizedUnitSOIds: null
            };
        }

        // Check if user is active
        const user = await DBAPI.User.fetch(idUser);
        if (!user || !user.Active) {
            RK.logInfo(RK.LogSection.eAUTH, 'buildContext for inactive user', undefined, { idUser }, 'Authorization');
            return {
                idUser, isAdmin: false,
                authorizedUnitIds: [], authorizedProjectIds: [],
                effectiveProjectIds: [], effectiveProjectSOIds: [], authorizedUnitSOIds: []
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

        // Convert to SystemObject IDs for Solr filtering
        const effectiveProjectSOIds = await Authorization.projectIdsToSOIds(effectiveProjectIds);
        const authorizedUnitSOIds = await Authorization.unitIdsToSOIds(authorizedUnitIds);

        RK.logInfo(RK.LogSection.eAUTH, 'buildContext success', undefined, {
            idUser, units: authorizedUnitIds.length, projects: effectiveProjectIds.length
        }, 'Authorization');

        return {
            idUser, isAdmin,
            authorizedUnitIds, authorizedProjectIds,
            effectiveProjectIds, effectiveProjectSOIds, authorizedUnitSOIds
        };
    }

    /**
     * Get cached authorization context from LocalStore.
     * Returns null when enforcement is disabled or no context is available.
     */
    static getContext(): AuthorizationContext | null {
        if (!Config.auth.enforceProjectAuth)
            return null;
        const LS: LocalStore | undefined = ASL.getStore();
        return LS?.authContext ?? null;
    }

    // #endregion

    // #region Access Checks

    /**
     * Check if user can access a specific Project by idProject.
     */
    static canAccessProject(ctx: AuthorizationContext, idProject: number): boolean {
        if (ctx.isAdmin) return true;
        if (ctx.effectiveProjectIds === null) return true;
        return ctx.effectiveProjectIds.includes(idProject);
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
            const allowed = projectIds.some(pid => ctx.effectiveProjectIds!.includes(pid));
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

    private static logDenial(idUser: number, idSystemObject: number, surface: string): void {
        RK.logInfo(RK.LogSection.eSEC, 'access denied',
            undefined, { idUser, idSystemObject, surface }, 'Authorization');
    }

    // #endregion
}
