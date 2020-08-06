/**
 * Config
 *
 * Organize and export server config here by extending from .env
 */
enum AUTH_TYPE {
    LOCAL = 'local',
    LDAP = 'ldapauth'
}

enum COLLECTION_TYPE {
    EDAN = 'edan'
}

type ConfigType = {
    auth: {
        type: AUTH_TYPE;
        session: {
            maxAge: number;
            checkPeriod: number;
            expires: Date;
        };
    },
    collection: {
        type: COLLECTION_TYPE;
        edan: {
            server: string;
            appId: string;
            authKey: string;
        }
    }
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
    },
    collection: {
        type: COLLECTION_TYPE.EDAN,
        edan: {
            server: process.env.EDAN_SERVER ? process.env.EDAN_SERVER : 'http://edan.si.edu/',
            appId: process.env.EDAN_APPID ? process.env.EDAN_APPID : 'OCIO3D',
            authKey: process.env.EDAN_AUTH_KEY ? process.env.EDAN_AUTH_KEY : ''
        }
    }
};

export { Config as default, AUTH_TYPE, COLLECTION_TYPE };
