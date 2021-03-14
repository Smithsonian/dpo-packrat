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

enum JOB_TYPE {
    DEFAULT = 'default'
}

enum NAVIGATION_TYPE {
    DEFAULT,
    DB = 'db',
    SOLR = 'solr'
}

enum STORAGE_TYPE {
    LOCAL = 'local'
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
    job: {
        type: JOB_TYPE;
        cookServerUrl: string;
        cookClientId: string;
    },
    log: {
        root: string;
    },
    navigation: {
        type: NAVIGATION_TYPE;
    },
    storage: {
        type: STORAGE_TYPE;
        rootRepository: string;
        rootStaging: string; // this should be local storage (not NAS or cloud)
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
    job: {
        type: JOB_TYPE.DEFAULT,
        cookServerUrl: process.env.COOK_SERVER_URL ? process.env.COOK_SERVER_URL : /* istanbul ignore next */ 'http://si-3ddigip01.si.edu:8000/',
        cookClientId: '5b258c8e-108c-4990-a088-17ffd6e22852', // Concierge's client ID; taken from C:\Tools\CookDev\server\clients.json on Cook server
    },
    log: {
        root: './var/logs'
    },
    navigation: {
        type: NAVIGATION_TYPE.SOLR,
    },
    storage: {
        type: STORAGE_TYPE.LOCAL,
        rootRepository: process.env.OCFL_STORAGE_ROOT ? process.env.OCFL_STORAGE_ROOT : /* istanbul ignore next */ './var/Storage/Repository',
        rootStaging: process.env.OCFL_STAGING_ROOT ? process.env.OCFL_STAGING_ROOT : /* istanbul ignore next */ './var/Storage/Staging'
    },
};

export { Config, AUTH_TYPE, COLLECTION_TYPE, JOB_TYPE, NAVIGATION_TYPE, STORAGE_TYPE };