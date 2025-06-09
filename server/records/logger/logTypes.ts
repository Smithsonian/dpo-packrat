// type validLevels = 'crit' | 'error' | 'warn' | 'info' | 'debug' | 'perf';
export enum LogLevel {
    CRITICAL = 'crit',
    ERROR = 'error',
    WARNING = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
    PERFORMANCE = 'perf'
}

export enum LogSection { // logger section
    eAUTH   = 'AUTH',  // authentication
    eCACHE  = 'CACHE', // cache
    eCOLL   = 'COL',   // collections
    eCON    = 'CON',   // console-redirected messages
    eCONF   = 'CFG',   // config
    eDB     = 'DB',    // database
    eEVENT  = 'EVENT', // event
    eGQL    = 'GQL',   // graphql
    eHTTP   = 'HTTP',  // http
    eJOB    = 'JOB',   // job
    eMETA   = 'META',  // metadata
    eMIG    = 'MIG',   // migration
    eNAV    = 'NAV',   // navigation/search
    eRPT    = 'RPT',   // report
    eSEC    = 'SEC',   // security
    eSTR    = 'STORE', // storage
    eSYS    = 'SYS',   // system/utilities
    eTEST   = 'TEST',  // test code
    eWF     = 'WF',    // workflow
    eNONE   = '*****', // none specified ... don't use this!
}

/**
 * Building list of used terms to inform a structured, typesafe approach to messages
 *
 * user login <attempt|success|failed>
 * get user <success|failed>
 *
 * system config <attempt|success|failed>
 *
 * sending email <attempt|success|failed>
 * sending slack <attempt|success|failed>
 * clear slack channel <success|failed>
 *
 * workflow <success|failed|started|update>
 * workflow steps <update>
 *
 * create event <consumer|producer><success|failed>
 * register event <consumer><success|failed>
 * unregister event <consumer>
 */