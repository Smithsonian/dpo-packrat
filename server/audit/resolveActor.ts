/**
 * Produces an Actor at each system entry point. Call ONCE per request/job and
 * stash the result on LocalStore.actor. Downstream code should never re-resolve.
 */
import type { Request } from 'express';
import { Actor, Subsystem } from './Actor';
import { ASL, LocalStore } from '../utils/localStore';

/**
 * Resolve the Actor for an HTTP request. Handles both authenticated-user
 * requests (GraphQL and REST) and internal-tooling calls without a session.
 */
export function resolveActorFromRequest(req: Request, fallbackSubsystem: Subsystem = 'Unknown'): Actor {
    // Prefer the idUser already stashed on the session (see Helpers.getUserDetailsFromRequest).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user: { idUser?: number } | undefined = (req as any)?.user;
    if (user && typeof user.idUser === 'number')
        return Actor.user(user.idUser);
    return Actor.system(fallbackSubsystem);
}

/**
 * Resolve an Actor from an already-established LocalStore. Used by code paths
 * that run inside an ASL scope established by higher-level middleware.
 */
export function resolveActorFromStore(LS: LocalStore | undefined, fallbackSubsystem: Subsystem = 'Unknown'): Actor {
    const existing = LS?.getActor();
    if (existing) return existing;
    return Actor.system(fallbackSubsystem);
}

/**
 * Wrap `fn` in a new ASL scope whose LocalStore carries the supplied Actor.
 * Used for scheduled jobs, retention runs, startup tasks — anywhere there is
 * no HTTP request to populate LS from.
 *
 * If there is already an active ASL scope, the Actor is stamped onto that
 * existing store instead of creating a fresh one — so scheduled work triggered
 * from inside a user request stays attributed to the user's scope.
 */
export async function withActor<T>(actor: Actor, fn: () => Promise<T>): Promise<T> {
    const existing: LocalStore | undefined = ASL.getStore();
    if (existing) {
        existing.actor = actor;
        if (actor.kind === 'impersonation')
            existing.idUser = actor.onBehalfOfIdUser;
        return fn();
    }
    const LS = new LocalStore(true, actor.kind === 'impersonation' ? actor.onBehalfOfIdUser : null);
    LS.actor = actor;
    return ASL.run(LS, fn);
}
