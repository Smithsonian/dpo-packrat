/**
 * Startup configuration validation.
 *
 * Returns a list of human-readable problems with the current environment so the
 * server can refuse to boot on missing or weak required configuration rather than
 * starting half-configured (and potentially insecure). Pure and side-effect free:
 * the caller decides what to do with the result (HttpServer exits on a non-empty
 * list outside of test/CI).
 */
import { Config, ENVIRONMENT_TYPE, AUTH_TYPE } from './index';

// Known placeholder / shipped values that must never sign real sessions.
const WEAK_SESSION_SECRETS: string[] = ['fallback-secret', 'changeme', 'change-me', 'secret', 'password'];
const MIN_SESSION_SECRET_LENGTH: number = 32;

function present(name: string): boolean {
    const value: string | undefined = process.env[name];
    return typeof value === 'string' && value.trim().length > 0;
}

export function validateConfig(): string[] {
    const errors: string[] = [];
    const isProd: boolean = Config.environment.type === ENVIRONMENT_TYPE.PRODUCTION;

    // Required in every environment — there is no sensible in-code default and the
    // server cannot function without it.
    if (!present('PACKRAT_DATABASE_URL'))
        errors.push('PACKRAT_DATABASE_URL is required but missing');

    // Required in production. Limited to settings that a real production host must
    // declare explicitly and cannot safely fall back to an in-code default for: the
    // session signing key (security) and the OCFL roots (prod data must not land in
    // the dev './var' default). Other [prod]-marked vars in .env.template (endpoints,
    // EDAN, Cook) carry prod-correct in-code defaults, so they are documented-required
    // but not boot-blocking — promote them here once each is confirmed set in prod.
    if (isProd) {
        const prodRequired: string[] = [
            'PACKRAT_SESSION_SECRET',
            'PACKRAT_OCFL_STORAGE_ROOT',
            'PACKRAT_OCFL_STAGING_ROOT',
        ];
        for (const name of prodRequired)
            if (!present(name))
                errors.push(`${name} is required in production but missing`);
    }

    // Session secret strength — checked wherever a value is set, so a weak secret
    // is caught in development too (before it reaches production).
    const sessionSecret: string = (process.env.PACKRAT_SESSION_SECRET ?? '').trim();
    if (sessionSecret.length > 0) {
        if (WEAK_SESSION_SECRETS.includes(sessionSecret.toLowerCase()))
            errors.push('PACKRAT_SESSION_SECRET is a known placeholder value — set a strong random secret (e.g. `openssl rand -hex 32`)');
        else if (isProd && sessionSecret.length < MIN_SESSION_SECRET_LENGTH)
            errors.push(`PACKRAT_SESSION_SECRET must be at least ${MIN_SESSION_SECRET_LENGTH} characters in production`);
    }

    // Conditionally required — enabling LDAP auth needs its server + bind password.
    if (Config.auth.type === AUTH_TYPE.LDAP) {
        if (!present('PACKRAT_LDAP_SERVER'))
            errors.push('PACKRAT_LDAP_SERVER is required when PACKRAT_AUTH_TYPE=LDAP');
        if (!present('PACKRAT_LDAP_PASSWORD'))
            errors.push('PACKRAT_LDAP_PASSWORD is required when PACKRAT_AUTH_TYPE=LDAP');
    }

    return errors;
}
