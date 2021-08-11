/**
 * Config
 *
 * Organize and export server config here by extending from .env
 */
export enum AUDIT_TYPE {
    LOCAL = 'local',
}

export enum AUTH_TYPE {
    LOCAL = 'local',
    LDAP = 'ldap'
}

export enum COLLECTION_TYPE {
    EDAN = 'edan'
}

export enum EVENT_TYPE {
    INPROCESS = 'in-process'
}

export enum JOB_TYPE {
    NODE_SCHEDULE = 'node-schedule'
}

export enum NAVIGATION_TYPE {
    DEFAULT,
    DB = 'db',
    SOLR = 'solr'
}

export enum STORAGE_TYPE {
    LOCAL = 'local'
}

export enum WORKFLOW_TYPE {
    PACKRAT = 'packrat'
}

export interface LDAPConfig {
    server: string;
    password: string;
    CN: string;
    OU: string;
    DC: string;
}

export type ConfigType = {
    audit: {
        type: AUDIT_TYPE;
    },
    auth: {
        type: AUTH_TYPE;
        session: {
            maxAge: number;
            checkPeriod: number;
        };
        ldap: LDAPConfig;
    },
    collection: {
        type: COLLECTION_TYPE;
        edan: {
            server: string;
            api3d: string;
            appId: string;
            authKey: string;
        }
    },
    event: {
        type: EVENT_TYPE;
    },
    http: {
        clientUrl: string;
        serverUrl: string;
        port: number;
    },
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
    workflow: {
        type: WORKFLOW_TYPE;
    },
};

const oneDayInSeconds = 24 * 60 * 60; // 24hrs in seconds

export const Config: ConfigType = {
    audit: {
        type: AUDIT_TYPE.LOCAL,
    },
    auth: {
        type: process.env.PACKRAT_AUTH_TYPE == 'LDAP' ? AUTH_TYPE.LDAP : AUTH_TYPE.LOCAL,
        session: {
            maxAge: oneDayInSeconds * 1000, // expiration time = 24 hours, in milliseconds
            checkPeriod: oneDayInSeconds    // prune expired entries every 24 hours
        },
        ldap: {
            server: process.env.PACKRAT_LDAP_SERVER ? process.env.PACKRAT_LDAP_SERVER : 'ldap://160.111.103.197:389',
            password: process.env.PACKRAT_LDAP_PASSWORD ? process.env.PACKRAT_LDAP_PASSWORD : '',
            CN: process.env.PACKRAT_LDAP_CN ? process.env.PACKRAT_LDAP_CN : 'CN=PackratAuthUser',
            OU: process.env.PACKRAT_LDAP_OU ? process.env.PACKRAT_LDAP_OU : 'OU=Service Accounts,OU=Enterprise',
            DC: process.env.PACKRAT_LDAP_DC ? process.env.PACKRAT_LDAP_DC : 'DC=US,DC=SINET,DC=SI,DC=EDU',
        },
    },
    collection: {
        type: COLLECTION_TYPE.EDAN,
        edan: {
            server: process.env.PACKRAT_EDAN_SERVER ? process.env.PACKRAT_EDAN_SERVER : /* istanbul ignore next */ 'https://edan.si.edu/',
            api3d: process.env.PACKRAT_EDAN_3D_API ? process.env.PACKRAT_EDAN_3D_API : /* istanbul ignore next */ 'https://3d-api.si.edu/',
            appId: process.env.PACKRAT_EDAN_APPID ? process.env.PACKRAT_EDAN_APPID : /* istanbul ignore next */ 'OCIO3D',
            authKey: process.env.PACKRAT_EDAN_AUTH_KEY ? process.env.PACKRAT_EDAN_AUTH_KEY : /* istanbul ignore next */  ''
        }
    },
    event: {
        type: EVENT_TYPE.INPROCESS,
    },
    http: {
        clientUrl: process.env.PACKRAT_CLIENT_ENDPOINT ? process.env.PACKRAT_CLIENT_ENDPOINT : 'https://packrat.si.edu:8443',
        serverUrl: process.env.REACT_APP_PACKRAT_SERVER_ENDPOINT ? process.env.REACT_APP_PACKRAT_SERVER_ENDPOINT : 'https://packrat.si.edu:8443/server',
        port: process.env.PACKRAT_SERVER_PORT ? parseInt(process.env.PACKRAT_SERVER_PORT) : 4000,
    },
    job: {
        type: JOB_TYPE.NODE_SCHEDULE,
        cookServerUrl: process.env.PACKRAT_COOK_SERVER_URL ? process.env.PACKRAT_COOK_SERVER_URL : /* istanbul ignore next */ 'http://si-3ddigip01.si.edu:8000/',
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
        rootRepository: process.env.PACKRAT_OCFL_STORAGE_ROOT ? process.env.PACKRAT_OCFL_STORAGE_ROOT : /* istanbul ignore next */ './var/Storage/Repository',
        rootStaging: process.env.PACKRAT_OCFL_STAGING_ROOT ? process.env.PACKRAT_OCFL_STAGING_ROOT : /* istanbul ignore next */ './var/Storage/Staging'
    },
    workflow: {
        type: WORKFLOW_TYPE.PACKRAT,
    }
};
