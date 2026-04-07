import crypto from 'crypto';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export type TokenType = 'webdav' | 'preview';

interface TokenEntryBase {
    type: TokenType;
    idSystemObject: number;
    expiry: number;
}

export interface WebDAVTokenEntry extends TokenEntryBase {
    type: 'webdav';
    idUser: number;
}

export interface PreviewTokenEntry extends TokenEntryBase {
    type: 'preview';
    clientId: string;
    userId: string;
}

export type TokenEntry = WebDAVTokenEntry | PreviewTokenEntry;

interface TokenTypeConfig {
    ttlMs: number;
    maxEntries: number;
    slidingWindow: boolean;
}

const TOKEN_CONFIG: Record<TokenType, TokenTypeConfig> = {
    webdav:  { ttlMs: 60 * 60 * 1000,      maxEntries: 100, slidingWindow: true  }, // 1 hour
    preview: { ttlMs: 2 * 60 * 60 * 1000,   maxEntries: 200, slidingWindow: false }, // 2 hours
};

type GeneratePayload<T extends TokenType> =
    T extends 'webdav'  ? { idUser: number; idSystemObject: number } :
        T extends 'preview' ? { idSystemObject: number; clientId: string; userId: string } :
            never;

export class TokenStore {
    private static tokens: Map<string, TokenEntry> = new Map();

    static generate<T extends TokenType>(type: T, payload: GeneratePayload<T>): string {
        TokenStore.cleanup(type);

        const config: TokenTypeConfig = TOKEN_CONFIG[type];
        const token: string = crypto.randomUUID();
        const entry: TokenEntry = { ...payload, type, expiry: Date.now() + config.ttlMs } as TokenEntry;
        TokenStore.tokens.set(token, entry);

        RK.logInfo(RK.LogSection.eHTTP, `${type} token generated`, undefined,
            { ...payload, token: token.substring(0, 8) + '...' }, 'TokenStore');
        return token;
    }

    static validate(token: string): TokenEntry | null {
        const entry: TokenEntry | undefined = TokenStore.tokens.get(token);
        if (!entry)
            return null;

        if (Date.now() > entry.expiry) {
            TokenStore.tokens.delete(token);
            return null;
        }

        const config: TokenTypeConfig = TOKEN_CONFIG[entry.type];
        if (config.slidingWindow)
            entry.expiry = Date.now() + config.ttlMs;

        return entry;
    }

    static revoke(token: string): void {
        TokenStore.tokens.delete(token);
    }

    private static cleanup(type: TokenType): void {
        const config: TokenTypeConfig = TOKEN_CONFIG[type];
        let typeCount: number = 0;
        for (const entry of TokenStore.tokens.values()) {
            if (entry.type === type)
                typeCount++;
        }

        if (typeCount <= config.maxEntries)
            return;

        const now: number = Date.now();
        for (const [token, entry] of TokenStore.tokens) {
            if (entry.type === type && now > entry.expiry)
                TokenStore.tokens.delete(token);
        }
    }
}
