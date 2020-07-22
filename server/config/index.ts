/**
 * Config
 *
 * Organize and export server config here by extending from .env
 */
enum AUTH_TYPE {
    LOCAL = 'local',
    LDAP = 'ldapauth'
}

type ConfigType = {
    auth: {
        type: AUTH_TYPE;
        session: {
            maxAge: number;
            checkPeriod: number;
            expires: Date;
        };
    };
};

const oneDayMs = 24 * 60 * 60 * 1000; // 24hrs in milliseconds

const Config: ConfigType = {
    auth: {
        type: AUTH_TYPE.LOCAL,
        session: {
            maxAge: Date.now() + oneDayMs, // 24hrs expiration time
            expires: new Date(Date.now() + oneDayMs),
            checkPeriod: 24 * 60 * 60 // prune expired entries every 24h
        }
    }
};

export { Config as default, AUTH_TYPE };
