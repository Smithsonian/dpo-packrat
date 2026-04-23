import { Actor } from '../../audit/Actor';
import { resolveActorFromRequest, resolveActorFromStore, withActor } from '../../audit/resolveActor';
import { LocalStore, ASL } from '../../utils/localStore';

describe('Actor sum type + invariants', () => {
    test('user variant persists as { idUser, SystemActor=null }', () => {
        const a = Actor.user(42);
        const cols = Actor.toAuditColumns(a);
        expect(cols).toEqual({ idUser: 42, SystemActor: null });
        expect(Actor.isValid(a)).toBe(true);
    });

    test('system variant persists as { idUser=null, SystemActor=subsystem }', () => {
        const a = Actor.system('Cook');
        expect(Actor.toAuditColumns(a)).toEqual({ idUser: null, SystemActor: 'Cook' });
        expect(Actor.isValid(a)).toBe(true);
    });

    test('impersonation persists both idUser and SystemActor in same row', () => {
        const a = Actor.impersonation(7, 'Cook');
        expect(Actor.toAuditColumns(a)).toEqual({ idUser: 7, SystemActor: 'Cook' });
        expect(Actor.isValid(a)).toBe(true);
    });

    test('describe() produces human-readable output per variant', () => {
        expect(Actor.describe(Actor.user(1))).toBe('user(1)');
        expect(Actor.describe(Actor.system('SolrIndexer'))).toBe('system(SolrIndexer)');
        expect(Actor.describe(Actor.impersonation(3, 'Cook'))).toBe('Cook on behalf of user(3)');
    });

    test('invariant: no Actor produces both idUser=null and SystemActor=null', () => {
        for (const a of [Actor.user(1), Actor.system('X'), Actor.impersonation(2, 'Y')]) {
            const cols = Actor.toAuditColumns(a);
            expect(cols.idUser === null && cols.SystemActor === null).toBe(false);
        }
    });
});

describe('resolveActorFromRequest', () => {
    type FakeReq = { user?: { idUser?: number } };
    test('returns user actor when req.user.idUser present', () => {
        const req = { user: { idUser: 99 } } as unknown as FakeReq;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a = resolveActorFromRequest(req as any, 'WebDAV');
        expect(a).toEqual(Actor.user(99));
    });

    test('falls back to system(subsystem) without authenticated user', () => {
        const req = {} as unknown as FakeReq;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a = resolveActorFromRequest(req as any, 'WebDAV');
        expect(a).toEqual(Actor.system('WebDAV'));
    });
});

describe('LocalStore.getActor + resolveActorFromStore', () => {
    test('falls back to user(idUser) when slot unset', () => {
        const LS = new LocalStore(false, 5);
        expect(LS.getActor()).toEqual(Actor.user(5));
    });

    test('returns explicit actor when set', () => {
        const LS = new LocalStore(false, null);
        LS.actor = Actor.system('Startup');
        expect(LS.getActor()).toEqual(Actor.system('Startup'));
    });

    test('resolveActorFromStore falls back to system subsystem on empty LS', () => {
        const LS = new LocalStore(false, null);
        expect(resolveActorFromStore(LS, 'Test')).toEqual(Actor.system('Test'));
    });
});

describe('withActor', () => {
    test('populates LS.actor for the scoped function body', async () => {
        const actor = Actor.system('AuditRetention');
        let seen: ReturnType<typeof Actor.toAuditColumns> | null = null;
        await withActor(actor, async () => {
            const LS = ASL.getStore()!;
            seen = Actor.toAuditColumns(LS.getActor()!);
        });
        expect(seen).toEqual({ idUser: null, SystemActor: 'AuditRetention' });
    });

    test('impersonation also populates LS.idUser for legacy readers', async () => {
        let seenIdUser: number | null | undefined = 'unread' as unknown as number;
        await withActor(Actor.impersonation(42, 'Cook'), async () => {
            seenIdUser = ASL.getStore()!.idUser;
        });
        expect(seenIdUser).toBe(42);
    });
});
