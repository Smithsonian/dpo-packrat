/**
 * Config
 *
 * Organize and export server config here by extending from .env
 */
import { eAuditType, eNonSystemObjectType, eDBObjectType } from '../db/api/ObjectType';

export enum AUDIT_TYPE {
    LOCAL = 'local',
}

export enum AuditTier {
    PROTECT = 'TIER_PROTECT',
    STANDARD = 'TIER_STANDARD',
    TRANSIENT = 'TIER_TRANSIENT',
    FILLER = 'TIER_FILLER',
}

export type AuditRetention = {
    /** Full row + Data payload retained for this many days; 'forever' = never skeletoned. */
    retainFullDataDays: number | 'forever';
    /** Skeleton row (Data nulled) retained for this many days; 'forever' = never deleted. */
    retainSkeletonDays: number | 'forever';
};

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
        /** Per-tier retention windows. TIER_FILLER is log-only and has no DB retention. */
        tiers: {
            [AuditTier.PROTECT]: AuditRetention;
            [AuditTier.STANDARD]: AuditRetention;
            [AuditTier.TRANSIENT]: AuditRetention;
        };
        /** Code-defined mapping from eAuditType -> AuditTier. Unassigned types fall back to defaultUnmappedTier (STANDARD by default). */
        actionTiers: Partial<Record<eAuditType, AuditTier>>;
        /**
         * Tier applied when an emitted eAuditType has no entry in actionTiers. Defaults to STANDARD so a forgotten
         * map entry produces an audit row at default retention rather than silently disappearing. Startup self-check
         * logs a warning for any eAuditType missing from actionTiers.
         */
        defaultUnmappedTier: AuditTier;
        /** DB object types routed to log-only (OpenObserve), never to the Audit table. */
        logOnlyObjectTypes: eDBObjectType[];
        /** Batch size for retention job's skeleton / delete passes. */
        retentionBatchSize: number;
        /** node-schedule cron expression for the retention job. */
        retentionJobCron: string;
        /** Per-statement timeout (ms) on mutation transactions containing audit writes. */
        txStatementTimeoutMs: number;
        /** Retry count on Prisma P2034 (transaction deadlock / write conflict). */
        txDeadlockRetries: number;
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
        };
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
        isJest: boolean;
        isGitCI: boolean;
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
    slack: {
        apiKey: string;
        channels: string[];
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
        tiers: {
            [AuditTier.PROTECT]: {
                retainFullDataDays: 'forever',
                retainSkeletonDays: 'forever',
            },
            [AuditTier.STANDARD]: {
                retainFullDataDays: parseEnvDaysOrForever(process.env.PACKRAT_AUDIT_TIER_STANDARD_FULL_DAYS, 30),
                retainSkeletonDays: parseEnvDaysOrForever(process.env.PACKRAT_AUDIT_TIER_STANDARD_SKELETON_DAYS, 'forever'),
            },
            [AuditTier.TRANSIENT]: {
                retainFullDataDays: parseEnvDays(process.env.PACKRAT_AUDIT_TIER_TRANSIENT_FULL_DAYS, 30),
                retainSkeletonDays: parseEnvDays(process.env.PACKRAT_AUDIT_TIER_TRANSIENT_SKELETON_DAYS, 90),
            },
        },
        actionTiers: {
            // TIER_PROTECT - auth + business semantic actions
            [eAuditType.eAuthLogin]:                AuditTier.PROTECT,
            [eAuditType.eAuthFailed]:               AuditTier.PROTECT,
            [eAuditType.eAuthDenied]:               AuditTier.PROTECT,
            [eAuditType.eAuthGranted]:              AuditTier.PROTECT,
            [eAuditType.eAuthRevoked]:              AuditTier.PROTECT,
            [eAuditType.eSceneQCd]:                 AuditTier.PROTECT,
            [eAuditType.eActionPublish]:            AuditTier.PROTECT,
            [eAuditType.eActionUnpublish]:          AuditTier.PROTECT,
            [eAuditType.eActionAssignLicense]:      AuditTier.PROTECT,
            [eAuditType.eActionClearLicense]:       AuditTier.PROTECT,
            [eAuditType.eActionLicenseUpdate]:      AuditTier.PROTECT,
            [eAuditType.eActionEDANIDChange]:       AuditTier.PROTECT,
            [eAuditType.eActionRollbackSOV]:        AuditTier.PROTECT,
            [eAuditType.eActionRollbackAssetVersion]: AuditTier.PROTECT,
            [eAuditType.eActionRetire]:             AuditTier.PROTECT,
            [eAuditType.eActionReinstate]:          AuditTier.PROTECT,
            [eAuditType.eActionApproveForPublication]: AuditTier.PROTECT,
            [eAuditType.eActionPoseAndQC]:          AuditTier.PROTECT,
            [eAuditType.eActionIngest]:             AuditTier.PROTECT,
            [eAuditType.eActionAccessGrant]:        AuditTier.PROTECT,
            [eAuditType.eActionAccessRevoke]:       AuditTier.PROTECT,
            [eAuditType.eActionUpload]:             AuditTier.PROTECT,
            // TIER_STANDARD - CRUD on meaningful business entities (routed at the entity level via logOnlyObjectTypes)
            [eAuditType.eDBCreate]:                 AuditTier.STANDARD,
            [eAuditType.eDBUpdate]:                 AuditTier.STANDARD,
            [eAuditType.eDBDelete]:                 AuditTier.STANDARD,
            // TIER_TRANSIENT - ownership-relevant but not forensic
            [eAuditType.eSolrRebuild]:              AuditTier.TRANSIENT,
            [eAuditType.eGenDownloads]:             AuditTier.TRANSIENT,
            [eAuditType.eHTTPDownload]:             AuditTier.TRANSIENT,
            [eAuditType.eHTTPUpload]:               AuditTier.TRANSIENT,
            // Maintenance (retention job emits one row per run)
            [eAuditType.eActionSystemMaintenance]:  AuditTier.STANDARD,
        },
        defaultUnmappedTier: AuditTier.STANDARD,
        logOnlyObjectTypes: [
            eNonSystemObjectType.eSystemObjectXref,
            eNonSystemObjectType.eModelObject,
            eNonSystemObjectType.eModelMaterial,
            eNonSystemObjectType.eModelMaterialChannel,
            eNonSystemObjectType.eModelMaterialUVMap,
            eNonSystemObjectType.eModelObjectModelMaterialXref,
            eNonSystemObjectType.eWorkflowStep,
            eNonSystemObjectType.eWorkflowStepSystemObjectXref,
            eNonSystemObjectType.eMetadata,         // individual rows log-only; batch marker writes to DB at STANDARD
            eNonSystemObjectType.eModelSceneXref,
            eNonSystemObjectType.eSystemObjectVersionAssetVersionXref,
            eNonSystemObjectType.eCaptureDataGroupCaptureDataXref,
        ],
        retentionBatchSize: process.env.PACKRAT_AUDIT_RETENTION_BATCH_SIZE
            ? parseInt(process.env.PACKRAT_AUDIT_RETENTION_BATCH_SIZE) : 5000,
        retentionJobCron: process.env.PACKRAT_AUDIT_RETENTION_CRON
            ? process.env.PACKRAT_AUDIT_RETENTION_CRON : '0 3 * * *',
        txStatementTimeoutMs: process.env.PACKRAT_AUDIT_TX_STATEMENT_TIMEOUT_MS
            ? parseInt(process.env.PACKRAT_AUDIT_TX_STATEMENT_TIMEOUT_MS) : 60000,
        txDeadlockRetries: process.env.PACKRAT_AUDIT_TX_DEADLOCK_RETRIES
            ? parseInt(process.env.PACKRAT_AUDIT_TX_DEADLOCK_RETRIES) : 3,
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
                // includes all Admins by default
                6,  // Megan Dattoria
                11, // Katie Wolfe
                17, // Lindsey Dougan
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
        isJest: process.env.JEST_WORKER_ID !== undefined,
        isGitCI: process.env.GITHUB_ACTIONS === 'true',
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
        type: process.env.PACKRAT_NAVIGATION_TYPE === 'db' ? NAVIGATION_TYPE.DB : NAVIGATION_TYPE.SOLR,
    },
    slack: {
        apiKey: process.env.PACKRAT_SLACK_KEY ? process.env.PACKRAT_SLACK_KEY: 'undefined',
        channels: process.env.PACKRAT_SLACK_CHANNELS ? process.env.PACKRAT_SLACK_CHANNELS.split(',') : [],
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

function parseEnvDays(raw: string | undefined, fallback: number): number {
    if (raw === undefined) return fallback;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function parseEnvDaysOrForever(raw: string | undefined, fallback: number | 'forever'): number | 'forever' {
    if (raw === undefined) return fallback;
    if (raw.toLowerCase() === 'forever') return 'forever';
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
}

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
