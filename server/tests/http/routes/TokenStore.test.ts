/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any */
import { TokenStore } from '../../../http/routes/TokenStore';

describe('TokenStore', () => {
    const clientId = 'test-client-id';
    const userId = 'test-user-123';
    const idSystemObject = 42;
    const idUser = 7;

    // Helper to access the private tokens map
    function getTokensMap(): Map<string, any> {
        return (TokenStore as any).tokens as Map<string, any>;
    }

    beforeEach(() => {
        getTokensMap().clear();
    });

    // --- Preview token tests ---

    describe('preview tokens', () => {
        test('generate returns a non-empty string token', () => {
            const token = TokenStore.generate('preview', { idSystemObject, clientId, userId });
            expect(token).toBeTruthy();
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
        });

        test('generate returns unique tokens on each call', () => {
            const token1 = TokenStore.generate('preview', { idSystemObject, clientId, userId });
            const token2 = TokenStore.generate('preview', { idSystemObject, clientId, userId });
            expect(token1).not.toEqual(token2);
        });

        test('validate returns entry with type preview for a valid token', () => {
            const token = TokenStore.generate('preview', { idSystemObject, clientId, userId });
            const entry = TokenStore.validate(token);

            expect(entry).toBeTruthy();
            expect(entry!.type).toBe('preview');
            expect(entry!.idSystemObject).toBe(idSystemObject);
            expect((entry as any).clientId).toBe(clientId);
            expect((entry as any).userId).toBe(userId);
        });

        test('validate returns null for an unknown token', () => {
            const entry = TokenStore.validate('non-existent-token-00000000');
            expect(entry).toBeNull();
        });

        test('validate returns null for an expired token', () => {
            const token = TokenStore.generate('preview', { idSystemObject, clientId, userId });
            expect(TokenStore.validate(token)).toBeTruthy();

            // Force expiry
            const entry = getTokensMap().get(token);
            entry.expiry = Date.now() - 1000;

            expect(TokenStore.validate(token)).toBeNull();
        });

        test('preview tokens do not use sliding window', () => {
            const token = TokenStore.generate('preview', { idSystemObject, clientId, userId });
            const entry = getTokensMap().get(token);
            const originalExpiry = entry.expiry;

            TokenStore.validate(token);
            expect(entry.expiry).toBe(originalExpiry);
        });

        test('revoke removes a token so it cannot be validated', () => {
            const token = TokenStore.generate('preview', { idSystemObject, clientId, userId });
            expect(TokenStore.validate(token)).toBeTruthy();

            TokenStore.revoke(token);
            expect(TokenStore.validate(token)).toBeNull();
        });

        test('revoke is a no-op for unknown tokens', () => {
            TokenStore.revoke('does-not-exist');
        });

        test('scope verification: token for scene A cannot be used for scene B', () => {
            const idSceneA = 100;
            const idSceneB = 200;

            const tokenA = TokenStore.generate('preview', { idSystemObject: idSceneA, clientId, userId });
            const entry = TokenStore.validate(tokenA);

            expect(entry).toBeTruthy();
            expect(entry!.idSystemObject).toBe(idSceneA);
            expect(entry!.idSystemObject).not.toBe(idSceneB);
        });

        test('cleanup removes expired preview entries when max entries exceeded', () => {
            const tokens = getTokensMap();
            const now = Date.now();

            // Fill with 201 expired preview tokens
            for (let i = 0; i < 201; i++) {
                tokens.set(`expired-preview-${i}`, {
                    type: 'preview',
                    idSystemObject: i,
                    clientId: 'cleanup-test',
                    userId: 'cleanup-user',
                    expiry: now - 1000,
                });
            }

            expect(tokens.size).toBe(201);

            // Generating a new preview token triggers cleanup for preview type
            const freshToken = TokenStore.generate('preview', { idSystemObject, clientId, userId });

            // All expired preview tokens removed, only the fresh one remains
            expect(tokens.size).toBe(1);
            expect(TokenStore.validate(freshToken)).toBeTruthy();
        });
    });

    // --- WebDAV token tests ---

    describe('webdav tokens', () => {
        test('generate returns a non-empty string token', () => {
            const token = TokenStore.generate('webdav', { idUser, idSystemObject });
            expect(token).toBeTruthy();
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
        });

        test('generate returns unique tokens on each call', () => {
            const token1 = TokenStore.generate('webdav', { idUser, idSystemObject });
            const token2 = TokenStore.generate('webdav', { idUser, idSystemObject });
            expect(token1).not.toEqual(token2);
        });

        test('validate returns entry with type webdav for a valid token', () => {
            const token = TokenStore.generate('webdav', { idUser, idSystemObject });
            const entry = TokenStore.validate(token);

            expect(entry).toBeTruthy();
            expect(entry!.type).toBe('webdav');
            expect(entry!.idSystemObject).toBe(idSystemObject);
            expect((entry as any).idUser).toBe(idUser);
        });

        test('validate returns null for an expired token', () => {
            const token = TokenStore.generate('webdav', { idUser, idSystemObject });
            expect(TokenStore.validate(token)).toBeTruthy();

            // Force expiry
            const entry = getTokensMap().get(token);
            entry.expiry = Date.now() - 1000;

            expect(TokenStore.validate(token)).toBeNull();
        });

        test('webdav tokens use sliding window (expiry refreshed on validate)', () => {
            const token = TokenStore.generate('webdav', { idUser, idSystemObject });
            const entry = getTokensMap().get(token);

            // Set expiry to a known near-future value
            entry.expiry = Date.now() + 1000;
            const before = entry.expiry;

            TokenStore.validate(token);

            // Sliding window should have refreshed expiry well beyond the 1s we set
            expect(entry.expiry).toBeGreaterThan(before);
        });

        test('revoke removes a webdav token', () => {
            const token = TokenStore.generate('webdav', { idUser, idSystemObject });
            expect(TokenStore.validate(token)).toBeTruthy();

            TokenStore.revoke(token);
            expect(TokenStore.validate(token)).toBeNull();
        });

        test('cleanup removes expired webdav entries when max entries exceeded', () => {
            const tokens = getTokensMap();
            const now = Date.now();

            // Fill with 101 expired webdav tokens
            for (let i = 0; i < 101; i++) {
                tokens.set(`expired-webdav-${i}`, {
                    type: 'webdav',
                    idUser: i,
                    idSystemObject: i,
                    expiry: now - 1000,
                });
            }

            expect(tokens.size).toBe(101);

            const freshToken = TokenStore.generate('webdav', { idUser, idSystemObject });

            // All expired webdav tokens removed, only the fresh one remains
            expect(tokens.size).toBe(1);
            expect(TokenStore.validate(freshToken)).toBeTruthy();
        });
    });

    // --- Cross-type isolation tests ---

    describe('cross-type isolation', () => {
        test('preview cleanup does not remove valid webdav tokens', () => {
            const tokens = getTokensMap();
            const now = Date.now();

            // Add a valid webdav token
            const webdavToken = TokenStore.generate('webdav', { idUser, idSystemObject });

            // Fill preview type past its max with expired entries
            for (let i = 0; i < 201; i++) {
                tokens.set(`expired-preview-${i}`, {
                    type: 'preview',
                    idSystemObject: i,
                    clientId: 'x',
                    userId: 'x',
                    expiry: now - 1000,
                });
            }

            // Trigger preview cleanup
            TokenStore.generate('preview', { idSystemObject: 999, clientId: 'a', userId: 'b' });

            // WebDAV token should still be valid
            const entry = TokenStore.validate(webdavToken);
            expect(entry).toBeTruthy();
            expect(entry!.type).toBe('webdav');
        });

        test('webdav and preview tokens are independent', () => {
            const wToken = TokenStore.generate('webdav', { idUser, idSystemObject });
            const pToken = TokenStore.generate('preview', { idSystemObject, clientId, userId });

            const wEntry = TokenStore.validate(wToken);
            const pEntry = TokenStore.validate(pToken);

            expect(wEntry!.type).toBe('webdav');
            expect(pEntry!.type).toBe('preview');
        });
    });
});
