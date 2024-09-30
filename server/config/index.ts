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

export enum ENVIRONMENT_TYPE {
    PRODUCTION = 'production',
    DEVELOPMENT = 'development',
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
    CA: string;
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
        users: {
            admin: number[];    // users that are full admin
            tools: number[];    // users that can access tools like batch processing
        }
    },
    collection: {
        type: COLLECTION_TYPE;
        edan: {
            server: string;
            api3d: string;
            appId: string;
            authKey: string;
            upsertContentRoot: string;
            stagingRoot: string;
            resourcesHotFolder: string;
        }
    },
    event: {
        type: EVENT_TYPE;
    },
    environment: {
        type: ENVIRONMENT_TYPE;
    },
    http: {
        clientUrl: string;
        serverUrl: string;
        port: number;
    },
    job: {
        type: JOB_TYPE;
        cookServerUrls: string[];
        cookClientId: string;
    },
    it: {
        itopsEmail: string[];
        smtpHost?: string | undefined;
        smtpPort?: number | undefined;
        smtpSecure?: boolean | undefined;
        smtpAuthUser?: string | undefined;
        smtpAuthPassword?: string | undefined;
    },
    log: {
        root: string;
        targetRate: number;
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
    }
};

const oneDay            = 24 * 60 * 60;
// const fifteenMinutes    =  1 * 15 * 60;
const threeHours        =  3 * 60 * 60;
const debugSessionTimeout = false;

export const Config: ConfigType = {
    audit: {
        type: AUDIT_TYPE.LOCAL,
    },
    auth: {
        type: process.env.PACKRAT_AUTH_TYPE == 'LDAP' ? AUTH_TYPE.LDAP : AUTH_TYPE.LOCAL,
        session: {
            maxAge: !debugSessionTimeout ? (((process.env.NODE_ENV === 'production') ? threeHours : oneDay) * 1000) : 8000,     // expiration time 3 hours, in milliseconds (HACK: revert to 15min with updated Auth support)
            checkPeriod: oneDay                                                                                                 // prune expired entries every 24 hours
        },
        ldap: {
            server: process.env.PACKRAT_LDAP_SERVER ? process.env.PACKRAT_LDAP_SERVER : 'ldaps://ldaps.si.edu:636',
            password: process.env.PACKRAT_LDAP_PASSWORD ? process.env.PACKRAT_LDAP_PASSWORD : '',
            CN: process.env.PACKRAT_LDAP_CN ? process.env.PACKRAT_LDAP_CN : 'CN=PackratAuthUser',
            OU: process.env.PACKRAT_LDAP_OU ? process.env.PACKRAT_LDAP_OU : 'OU=Service Accounts,OU=Enterprise',
            DC: process.env.PACKRAT_LDAP_DC ? process.env.PACKRAT_LDAP_DC : 'DC=US,DC=SINET,DC=SI,DC=EDU',
            CA: process.env.PACKRAT_LDAP_CA ? process.env.PACKRAT_LDAP_CA : '/etc/ssl/certs/ldaps.si.edu.cer',
        },
        users: {
            admin: [
                2,  // Jon Blundell
                4,  // Jamie Cope
                5,  // Eric Maslowski
            ],
            tools: [
                2,  // Jon Blundell
                4,  // Jamie Cope
                5,  // Eric Maslowski
                6,  // Megan Dattoria
                11, // Katie Wolfe
            ]
        },
    },
    collection: {
        type: COLLECTION_TYPE.EDAN,
        edan: {
            // defaulting to development environment for EDAN if environment variables not set for safety.
            server: process.env.PACKRAT_EDAN_SERVER ? process.env.PACKRAT_EDAN_SERVER : /* istanbul ignore next */ 'https://edan.si.edu/',
            api3d: process.env.PACKRAT_EDAN_3D_API ? process.env.PACKRAT_EDAN_3D_API : /* istanbul ignore next */ 'https://console.si.edu/apis/3d-api-dev/',
            appId: process.env.PACKRAT_EDAN_APPID ? process.env.PACKRAT_EDAN_APPID : /* istanbul ignore next */ 'OCIO3D',
            authKey: process.env.PACKRAT_EDAN_AUTH_KEY ? process.env.PACKRAT_EDAN_AUTH_KEY : /* istanbul ignore next */  '',
            upsertContentRoot: process.env.PACKRAT_EDAN_UPSERT_RESOURCE_ROOT ? process.env.PACKRAT_EDAN_UPSERT_RESOURCE_ROOT : 'nfs:///si-3ddigi-staging/upload/',
            stagingRoot: process.env.PACKRAT_EDAN_STAGING_ROOT ? process.env.PACKRAT_EDAN_STAGING_ROOT : '/3ddigip01/upload',
            resourcesHotFolder: process.env.PACKRAT_EDAN_RESOURCES_HOTFOLDER ? process.env.PACKRAT_EDAN_RESOURCES_HOTFOLDER : '/3ddigip01/3d_api_hot_folder/dev/3d_api_hot_folder_downloads',
        }
    },
    event: {
        type: EVENT_TYPE.INPROCESS,
    },
    environment: {
        type: (process.env.NODE_ENV && process.env.NODE_ENV=='production') ? ENVIRONMENT_TYPE.PRODUCTION : ENVIRONMENT_TYPE.DEVELOPMENT,
    },
    http: {
        clientUrl: process.env.PACKRAT_CLIENT_ENDPOINT ? process.env.PACKRAT_CLIENT_ENDPOINT : 'https://packrat.si.edu:8443',
        serverUrl: process.env.REACT_APP_PACKRAT_SERVER_ENDPOINT ? process.env.REACT_APP_PACKRAT_SERVER_ENDPOINT : 'https://packrat.si.edu:8443/server',
        port: process.env.PACKRAT_SERVER_PORT ? parseInt(process.env.PACKRAT_SERVER_PORT) : 4000,
    },
    job: {
        type: JOB_TYPE.NODE_SCHEDULE,
        cookServerUrls: process.env.PACKRAT_COOK_SERVER_URL ? process.env.PACKRAT_COOK_SERVER_URL.split(',') : /* istanbul ignore next */ ['http://si-3ddigip01.si.edu:8000/'],
        cookClientId: '5b258c8e-108c-4990-a088-17ffd6e22852', // Concierge's client ID; taken from C:\Tools\CookDev\server\clients.json on Cook server
    },
    it: {
        itopsEmail: process.env.PACKRAT_ITOPS_EMAIL ? process.env.PACKRAT_ITOPS_EMAIL.split(',') : /* istanbul ignore next */ [],
        smtpHost: process.env.PACKRAT_SMTP_HOST ? process.env.PACKRAT_SMTP_HOST : /* istanbul ignore next */ 'smtp.si.edu',
        smtpPort: process.env.PACKRAT_SMTP_PORT ? parseInt(process.env.PACKRAT_SMTP_PORT) : /* istanbul ignore next */ undefined,
        smtpSecure: process.env.PACKRAT_SMTP_SECURE ? convertStringSettingToBoolean(process.env.PACKRAT_SMTP_SECURE) : /* istanbul ignore next */ undefined,
        smtpAuthUser: process.env.PACKRAT_SMTP_AUTHUSER ? process.env.PACKRAT_SMTP_AUTHUSER : /* istanbul ignore next */ undefined,
        smtpAuthPassword: process.env.PACKRAT_SMTP_AUTHPASSWORD ? process.env.PACKRAT_SMTP_AUTHPASSWORD : /* istanbul ignore next */ undefined,
    },
    log: {
        root: process.env.PACKRAT_LOG_ROOT ? process.env.PACKRAT_LOG_ROOT : /* istanbul ignore next */ './var/logs',
        targetRate: process.env.PACKRAT_LOG_RATE ? parseInt(process.env.PACKRAT_LOG_RATE) : 100
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

function convertStringSettingToBoolean(input: string): boolean {
    switch (input.toLowerCase()) {
        case '': return false;
        case '0': return false;
        case '1': return true;
        case 'no': return false;
        case 'yes': return true;
        case 'false': return false;
        case 'true': return true;
        default: return false;
    }
}
