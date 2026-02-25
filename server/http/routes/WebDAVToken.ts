import crypto from 'crypto';
import { RecordKeeper as RK } from '../../records/recordKeeper';

interface WebDAVTokenEntry {
    idUser: number;
    idSystemObject: number;
    expiry: number;
}

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_ENTRIES = 100;

export class WebDAVTokenStore {
    private static tokens: Map<string, WebDAVTokenEntry> = new Map();

    static generate(idUser: number, idSystemObject: number): string {
        WebDAVTokenStore.cleanup();

        const token: string = crypto.randomUUID();
        WebDAVTokenStore.tokens.set(token, {
            idUser,
            idSystemObject,
            expiry: Date.now() + TOKEN_TTL_MS,
        });

        RK.logInfo(RK.LogSection.eHTTP, 'webdav token generated', undefined,
            { idUser, idSystemObject, token: token.substring(0, 8) + '...' }, 'WebDAVTokenStore');
        return token;
    }

    static validate(token: string, idSystemObject: number): number | null {
        const entry: WebDAVTokenEntry | undefined = WebDAVTokenStore.tokens.get(token);
        if (!entry)
            return null;

        if (Date.now() > entry.expiry) {
            WebDAVTokenStore.tokens.delete(token);
            return null;
        }

        if (entry.idSystemObject !== idSystemObject)
            return null;

        // Sliding window: refresh expiry on successful validation
        entry.expiry = Date.now() + TOKEN_TTL_MS;
        return entry.idUser;
    }

    static revoke(token: string): void {
        WebDAVTokenStore.tokens.delete(token);
    }

    private static cleanup(): void {
        if (WebDAVTokenStore.tokens.size <= MAX_ENTRIES)
            return;

        const now: number = Date.now();
        for (const [token, entry] of WebDAVTokenStore.tokens) {
            if (now > entry.expiry)
                WebDAVTokenStore.tokens.delete(token);
        }
    }
}
