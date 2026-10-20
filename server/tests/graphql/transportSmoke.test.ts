import { HttpServer } from '../../http';
import request from 'supertest';
import { Express } from 'express';
import * as DBAPI from '../../db';
import { expectLogErrors } from '../logGate';

// Real-Apollo transport smoke. The resolver suites call GraphQLApi directly with
// a mocked admin context; these POST GraphQL over HTTP through the Apollo/Express
// transport — the path an Apollo upgrade would break — and exercise the auth gate
// (unauthenticated requests to non-allowlisted queries are rejected).
describe('GraphQL transport + auth gate (real Apollo over HTTP)', () => {
    let app: Express;

    // Allowlisted query (no auth required); computeGQLQuery() resolves this to
    // 'getCurrentUser', which is in the server's unauthenticated allowlist.
    const GET_CURRENT_USER = `query {
    getCurrentUser {
        User {
            idUser
            Name
        }
    }
}`;

    // A gated query (not in the unauthenticated allowlist) used to prove denial.
    const GATED_QUERY = `query {
    getUser(input: { idUser: 1 }) {
        User {
            idUser
        }
    }
}`;

    beforeAll(async () => {
        const httpServer: HttpServer | null = await HttpServer.getInstance();
        expect(httpServer).toBeTruthy();
        if (!httpServer)
            throw new Error('HttpServer.getInstance() returned null');
        app = httpServer.app;
    });

    afterAll(async () => {
        await HttpServer.shutdown();
    });

    async function createTestUser(): Promise<DBAPI.User> {
        // Local auth treats password === email, so a fresh active user can log in
        // through the real /auth/login route.
        const email = `gql-transport-${Date.now()}@si.edu`;
        const user = new DBAPI.User({
            Name: 'GQL Transport Test', EmailAddress: email, SecurityID: 'SECURITY_ID',
            Active: true, DateActivated: new Date(), DateDisabled: null,
            WorkflowNotificationTime: new Date(), EmailSettings: 0, idUser: 0, SlackID: '',
        });
        expect(await user.create()).toBe(true);
        expect(user.idUser).toBeGreaterThan(0);
        return user;
    }

    test('authenticated getCurrentUser returns the logged-in user over HTTP', async () => {
        const user = await createTestUser();

        const agent = request.agent(app);
        const login = await agent.post('/auth/login').send({ email: user.EmailAddress, password: user.EmailAddress }).expect(200);
        expect(login.body.success).toBe(true);

        const res = await agent.post('/graphql').send({ query: GET_CURRENT_USER }).expect(200);
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.getCurrentUser.User).toBeTruthy();
        expect(res.body.data.getCurrentUser.User.idUser).toBe(user.idUser);
    });

    test('unauthenticated getCurrentUser (allowlisted) returns a null user, not an error', async () => {
        const res = await request(app).post('/graphql').send({ query: GET_CURRENT_USER }).expect(200);
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.getCurrentUser.User).toBeNull();
    });

    test('gated query is rejected by the auth gate when unauthenticated', async () => {
        // NOTE: httpAuthRequired = (NODE_ENV === 'production'), so outside
        // production isAuthenticated() always returns true and the HTTP auth gate
        // is effectively off. To exercise the real Apollo context gate (allowlist
        // check + AuthenticationError throw), force the unauthenticated path.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const authModule = require('../../http/auth');
        const spy = jest.spyOn(authModule, 'isAuthenticated').mockReturnValue(false);
        // Apollo's formatError logs the rejected (unauthenticated) operation at
        // error — expected for this negative test.
        expectLogErrors('GraphQL.Apollo.ServerOptions');
        try {
            const res = await request(app).post('/graphql').send({ query: GATED_QUERY });
            expect(res.body.errors).toBeTruthy();
            expect(res.body.errors.length).toBeGreaterThan(0);
            expect(JSON.stringify(res.body.errors)).toContain('getUser'); // gated query named in the failure
        } finally {
            spy.mockRestore();
        }
    });
});
