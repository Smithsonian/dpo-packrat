/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires */

// Hermetic coverage for LDAPAuth.verifyUser — previously untested. ldapjs is
// mocked (via jest.doMock + isolateModules, since the module export is
// non-configurable and jest.mock does not hoist in this ts-jest setup) so no
// network/LDAPS server is needed. The fake client drives the four outcomes of
// the verify orchestration: create client -> bind service -> search user ->
// bind user.

type FakeOpts = {
    serviceBindErr?: any;   // first bind() call = Packrat service account
    userBindErr?: any;      // second bind() call = the located user
    userDN?: string | null; // search result; null -> user not found
    searchErr?: any;        // error handed to the search callback
};

function buildFakeClient(opts: FakeOpts): any {
    let bindCall = 0;
    const client: any = {
        on() { return client; },
        destroy() { /* no-op */ },
        bind(_dn: string, _pw: string, cb: (err: any) => void): void {
            bindCall++;
            cb(bindCall === 1 ? (opts.serviceBindErr ?? null) : (opts.userBindErr ?? null));
        },
        search(_base: string, _options: any, cb: (err: any, res: any) => void): void {
            const handlers: Record<string, (arg: any) => void> = {};
            const res: any = { on(evt: string, h: (arg: any) => void) { handlers[evt] = h; return res; } };
            cb(opts.searchErr ?? null, res);
            // Emit after the caller attaches its handlers.
            process.nextTick(() => {
                if (opts.userDN)
                    handlers['searchEntry']?.({ objectName: opts.userDN });
                handlers['end']?.({});
            });
        },
    };
    return client;
}

// Load a fresh LDAPAuth with ldapjs mocked to return our fake client. Reset the
// registry first so LDAPAuth and ldapjs are re-required with the mock in place
// (jest.mock does not hoist here, and the ldapjs export is non-configurable).
function loadLDAPAuth(client: any): any {
    jest.resetModules();
    jest.doMock('ldapjs', () => ({ __esModule: true, createClient: () => client }));
    return require('../../auth/impl/LDAPAuth').default;
}

describe('Auth implementation: LDAPAuth.verifyUser (mocked ldapjs)', () => {
    afterEach(() => { jest.dontMock('ldapjs'); jest.resetModules(); });

    test('succeeds when service binds, user is found, and user binds', async () => {
        const LDAPAuth = loadLDAPAuth(buildFakeClient({ userDN: 'cn=jdoe,ou=people,dc=si,dc=edu' }));
        const result = await new LDAPAuth().verifyUser('jdoe@si.edu', 'correct-password');
        expect(result.success).toBe(true);
    });

    test('fails with invalid password when the user bind is rejected', async () => {
        const LDAPAuth = loadLDAPAuth(buildFakeClient({ userDN: 'cn=jdoe,ou=people,dc=si,dc=edu', userBindErr: new Error('invalid credentials') }));
        const result = await new LDAPAuth().verifyUser('jdoe@si.edu', 'wrong-password');
        expect(result.success).toBe(false);
        expect(result.error).toBe('invalid password');
    });

    test('fails when the user is not found in the directory', async () => {
        const LDAPAuth = loadLDAPAuth(buildFakeClient({ userDN: null }));
        const result = await new LDAPAuth().verifyUser('ghost@si.edu', 'whatever');
        expect(result.success).toBe(false);
    });

    test('fails when the service account cannot bind', async () => {
        const LDAPAuth = loadLDAPAuth(buildFakeClient({ serviceBindErr: new Error('service bind refused') }));
        const result = await new LDAPAuth().verifyUser('jdoe@si.edu', 'correct-password');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Unable to connect to LDAP server');
    });
});
