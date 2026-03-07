import { passport } from './framework';
import { Authorization } from './Authorization';
import AuthRouter from './AuthRouter';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { Config } from '../config';
import { httpAuthRequired } from '../http/auth';
import { RecordKeeper as RK } from '../records/recordKeeper';

const { PACKRAT_CLIENT_ENDPOINT, PACKRAT_SESSION_SECRET } = process.env;

if (!PACKRAT_CLIENT_ENDPOINT) {
    throw new Error('PACKRAT_CLIENT_ENDPOINT was not provided to cors config');
}

// for non-production deployments (where httpAuthRequired is false), allow requests from the Apollo GraphQL Studio:
const authCorsConfig = {
    origin: httpAuthRequired ? PACKRAT_CLIENT_ENDPOINT : [ PACKRAT_CLIENT_ENDPOINT, 'https://studio.apollographql.com' ],
    credentials: true
};

if (!PACKRAT_SESSION_SECRET) {
    throw new Error('PACKRAT_SESSION_SECRET was not provided to sessions config');
}

/**
 * To persist sessions we'll require to store them in our DB
 * https://www.npmjs.com/package/express-mysql-session
 */

const Store = MemoryStore(session);

const { maxAge, checkPeriod } = Config.auth.session;

const sessionStore = new Store({ checkPeriod });

const sessionConfig = {
    cookie: { maxAge },
    secret: PACKRAT_SESSION_SECRET,
    resave: true,
    rolling: true,
    saveUninitialized: true,
    store: sessionStore
};

const authSession = session(sessionConfig);

/** Rebuild AuthorizationContext for all active sessions belonging to the given users.
 *  Called after admin auth changes so users see updated permissions on their next request. */
export async function refreshUserSessions(userIds: number[]): Promise<void> {
    if (userIds.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = sessionStore as any;
    if (!store || typeof store.all !== 'function') return;

    return new Promise<void>((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.all(async (_err: unknown, sessions: Record<string, any> | null) => {
            if (!sessions) { resolve(); return; }
            const userSet = new Set(userIds);
            for (const [sid, sess] of Object.entries(sessions)) {
                const sessionUserId = sess?.passport?.user ?? sess?.authContext?.idUser;
                if (sessionUserId && userSet.has(sessionUserId)) {
                    const newContext = await Authorization.buildContext(sessionUserId);
                    sess.authContext = newContext;
                    store.set(sid, sess, () => {
                        RK.logInfo(RK.LogSection.eAUTH, 'refreshUserSessions',
                            `refreshed auth context for user ${sessionUserId}, session ${sid}`,
                            {}, 'Auth.Session');
                    });
                }
            }
            resolve();
        });
    });
}

/** Destroy all active sessions for the given users (used on deactivation). */
export async function destroyUserSessions(userIds: number[]): Promise<void> {
    if (userIds.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = sessionStore as any;
    if (!store || typeof store.all !== 'function') return;

    return new Promise<void>((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.all((_err: unknown, sessions: Record<string, any> | null) => {
            if (!sessions) { resolve(); return; }
            const userSet = new Set(userIds);
            for (const [sid, sess] of Object.entries(sessions)) {
                const sessionUserId = sess?.passport?.user ?? sess?.authContext?.idUser;
                if (sessionUserId && userSet.has(sessionUserId)) {
                    store.destroy(sid, () => {
                        RK.logInfo(RK.LogSection.eAUTH, 'destroyUserSessions',
                            `destroyed session ${sid} for user ${sessionUserId}`,
                            {}, 'Auth.Session');
                    });
                }
            }
            resolve();
        });
    });
}

export { passport, authCorsConfig, authSession, AuthRouter, sessionStore };
