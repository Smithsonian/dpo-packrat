/**
 * Discriminated sum type naming WHO performed an audited action. Resolved once
 * at the HTTP/GraphQL/scheduled-job entry boundary and threaded downstream.
 * Invariant: Audit rows never have BOTH idUser and SystemActor NULL.
 *
 * Variants:
 *   - user          -> authenticated session user
 *   - system        -> internal caller (Cook poll, Solr indexer, retention job,
 *                      startup, migration, WebDAV machine traffic, ...)
 *   - impersonation -> system acting on behalf of a user (e.g. Cook completing
 *                      a workflow originally kicked off by Workflow.idUserInitiator)
 *
 * Persistence on the Audit table:
 *   - user           : idUser = idUser,            SystemActor = NULL
 *   - system         : idUser = NULL,              SystemActor = subsystem
 *   - impersonation  : idUser = onBehalfOfIdUser,  SystemActor = bySystem
 */

/** Canonical subsystem names. Using a string-literal union keeps common callers */
/** typo-safe while still allowing ad-hoc subsystem strings where required. */
export type KnownSubsystem =
    | 'Cook'
    | 'SolrIndexer'
    | 'AuditRetention'
    | 'Migration'
    | 'WebDAV'
    | 'Startup'
    | 'Scheduler'
    | 'Test';

export type Subsystem = KnownSubsystem | string;

export type UserActor = { kind: 'user'; idUser: number };
export type SystemActor = { kind: 'system'; subsystem: Subsystem };
export type ImpersonationActor = { kind: 'impersonation'; onBehalfOfIdUser: number; bySystem: Subsystem };

export type Actor = UserActor | SystemActor | ImpersonationActor;

export const Actor = {
    user(idUser: number): UserActor {
        return { kind: 'user', idUser };
    },
    system(subsystem: Subsystem): SystemActor {
        return { kind: 'system', subsystem };
    },
    impersonation(onBehalfOfIdUser: number, bySystem: Subsystem): ImpersonationActor {
        return { kind: 'impersonation', onBehalfOfIdUser, bySystem };
    },

    /** Row-shape projection used when writing the Audit row. */
    toAuditColumns(actor: Actor): { idUser: number | null; SystemActor: string | null } {
        switch (actor.kind) {
            case 'user':          return { idUser: actor.idUser,          SystemActor: null };
            case 'system':        return { idUser: null,                  SystemActor: actor.subsystem };
            case 'impersonation': return { idUser: actor.onBehalfOfIdUser, SystemActor: actor.bySystem };
        }
    },

    /** Enforced invariant: idUser and SystemActor MUST NOT both be null. */
    isValid(actor: Actor): boolean {
        const { idUser, SystemActor } = Actor.toAuditColumns(actor);
        return idUser !== null || SystemActor !== null;
    },

    describe(actor: Actor): string {
        switch (actor.kind) {
            case 'user':          return `user(${actor.idUser})`;
            case 'system':        return `system(${actor.subsystem})`;
            case 'impersonation': return `${actor.bySystem} on behalf of user(${actor.onBehalfOfIdUser})`;
        }
    },
};
