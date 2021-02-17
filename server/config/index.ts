/**
 * Config
 *
 * Organize and export server config here by extending from .env
 */
enum AUTH_TYPE {
    LOCAL = 'local',
    LDAP = 'ldapauth'
}

enum STORAGE_TYPE {
    LOCAL = 'local'
}

enum COLLECTION_TYPE {
    EDAN = 'edan'
}

enum NAVIGATION_TYPE {
    DEFAULT,
    DB = 'db',
    SOLR = 'solr'
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
    log: {
        root: string;
    }
    storage: {
        type: STORAGE_TYPE;
        rootRepository: string;
        rootStaging: string; // this should be local storage (not NAS or cloud)
    },
    navigation: {
        type: NAVIGATION_TYPE;
    },
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
            server: process.env.EDAN_SERVER ? process.env.EDAN_SERVER : /* istanbul ignore next */ 'http://edan.si.edu/',
            appId: process.env.EDAN_APPID ? process.env.EDAN_APPID : /* istanbul ignore next */ 'OCIO3D',
            authKey: process.env.EDAN_AUTH_KEY ? process.env.EDAN_AUTH_KEY : /* istanbul ignore next */  ''
        }
    },
    log: {
        root: './var/logs'
    },
    storage: {
        type: STORAGE_TYPE.LOCAL,
        rootRepository: process.env.OCFL_STORAGE_ROOT ? process.env.OCFL_STORAGE_ROOT : /* istanbul ignore next */ './var/Storage/Repository',
        rootStaging: process.env.OCFL_STAGING_ROOT ? process.env.OCFL_STAGING_ROOT : /* istanbul ignore next */ './var/Storage/Staging'
    },
    navigation: {
        type: NAVIGATION_TYPE.SOLR,
    },
};

export { Config as default, AUTH_TYPE, COLLECTION_TYPE, STORAGE_TYPE, NAVIGATION_TYPE };