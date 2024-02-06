/* eslint-disable @typescript-eslint/no-explicit-any */

import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';
import { Config } from '../config';
import { ASL, LocalStore } from './localStore';

let logger: winston.Logger;
let ending: boolean = false;
export enum LS { // logger section
    eAUDIT, // audit
    eAUTH,  // authentication
    eCACHE, // cache
    eCOLL,  // collections
    eCON,   // console-redirected messages
    eCONF,  // config
    eDB,    // database
    eDEBUG, // debug only output
    eEVENT, // event
    eGQL,   // graphql
    eHTTP,  // http
    eJOB,   // job
    eMETA,  // metadata
    eMIG,   // migration
    eNAV,   // navigation
    eRPT,   // report
    eSTR,   // storage
    eSYS,   // system/utilities
    eTEST,  // test code
    eWF,    // workflow
    eNONE,  // none specified ... don't use this!
}

export function info(message: string | undefined, eLogSection: LS): void {
    logger.info(message ?? '', { eLS: eLogSection });
}

export function error(message: string | undefined, eLogSection: LS, obj: any | null = null): void {
    if (obj && typeof obj === 'object' && obj !== null) {
        obj.eLS = eLogSection;
        logger.error(message ?? '', obj);
    } else
        logger.error(message ?? '', { eLS: eLogSection });
}

export function end(): void {
    ending = true;
    logger.end();
}

function loggerSectionName(eLogSection: LS | undefined): string {
    switch (eLogSection) {
        case LS.eAUDIT: return 'AUD';
        case LS.eAUTH:  return 'ATH';
        case LS.eCACHE: return 'CCH';
        case LS.eCOLL:  return 'COL';
        case LS.eCON:   return 'CON';
        case LS.eCONF:  return 'CNF';
        case LS.eDB:    return 'DB ';
        case LS.eDEBUG: return 'DBG';
        case LS.eEVENT: return 'EVE';
        case LS.eGQL:   return 'GQL';
        case LS.eHTTP:  return 'HTP';
        case LS.eJOB:   return 'JOB';
        case LS.eMETA:  return 'MET';
        case LS.eMIG:   return 'MIG';
        case LS.eNAV:   return 'NAV';
        case LS.eRPT:   return 'RPT';
        case LS.eSTR:   return 'STR';
        case LS.eSYS:   return 'SYS';
        case LS.eTEST:  return 'tst';
        case LS.eWF:    return 'WF ';
        case LS.eNONE:  return '***';
        default:        return '***';
    }
}

function configureLogger(logPath: string | null): void {
    /* istanbul ignore if */
    if (logger)
        return;

    /* istanbul ignore else */
    if (!logPath)
        logPath = Config.log.root ? Config.log.root : /* istanbul ignore next */ './var/logs';

    logger = winston.createLogger({
        level: 'verbose',
        format: winston.format.combine(
            winston.format.errors({ stack: true }), // emit stack trace when Error objects are passed in
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            // winston.format.colorize(),
            // winston.format.json()
            // winston.format.simple(),
            winston.format.printf((info) => {
                const LS: LocalStore | undefined = ASL.getStore();
                const idRequest: number | undefined = LS?.idRequest;
                const reqID: string = idRequest ? ('00000' + (idRequest % 100000)).slice(-5) : ' --- ';

                const idUser: number | undefined | null = LS?.idUser;
                let userID: string = '---';
                if (idUser)
                    userID = (idUser < 1000) ? ('000' + (idUser % 1000)).slice(-3) : idUser.toString();

                const logSection: string = loggerSectionName(info.eLS);
                const stack: string = info.stack ? `\n${info.stack}` : '';
                return `${info.timestamp} [${reqID}] U${userID} ${logSection} ${info.level}: ${info.message}${stack}`;
            })
        ),
        transports: [
            new winston.transports.DailyRotateFile({
                filename: 'PackratCombined.%DATE%.log',
                dirname: logPath,
                datePattern: 'YYYY-MM-DD',
                maxSize: 100 * 1024 * 1024 // 100 MB
            }),
            new winston.transports.File({
                filename: path.join(logPath, 'PackratError.log'),
                level: 'error',
                maxsize: 100 * 1024 * 1024 // 100 MB
            }),
        ]
    });

    // Log to console only in non-production builds
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production')
        logger.add(new winston.transports.Console());

    try {
        /* istanbul ignore if */
        if (!fs.existsSync(logPath))
            fs.mkdirSync(logPath);
    } catch (error) /* istanbul ignore next */ {
        logger.error(error);
    }

    // Replace console debug/info/log/warn/error with our own versions:
    const _debug = console.debug;
    const _info = console.info;
    const _log = console.log;
    const _warn = console.warn;
    const _error = console.error;

    console.debug = function(...args) {
        if (!ending)
            info(`console.debug: ${handleConsoleArgs(args)}`, LS.eCON);
        return _debug.apply(console, args);
    };

    console.info = function(...args) {
        if (!ending)
            info(`console.info: ${handleConsoleArgs(args)}`, LS.eCON);
        return _info.apply(console, args);
    };

    console.log = function(...args) {
        if (!ending)
            info(`console.log: ${handleConsoleArgs(args)}`, LS.eCON);
        return _log.apply(console, args);
    };

    console.warn = function(...args) {
        if (!ending)
            info(`console.warn: ${handleConsoleArgs(args)}`, LS.eCON);
        return _warn.apply(console, args);
    };

    console.error = function(...args) {
        if (!ending)
            error(`console.error: ${handleConsoleArgs(args)}`, LS.eCON);
        return _error.apply(console, args);
    };

    // The following approach does not work. More thought and investigation is needed here
    // Observe writes to stdout and stderr; forward to our log
    // process.stdout.on('data', data => { info(`stdout: ${JSON.stringify(data)}`, LS.eCON); });
    // process.stderr.on('data', data => { error(`stderr: ${JSON.stringify(data)}`, LS.eCON); });

    info('**************************', LS.eSYS);
    info(`Writing logs to ${path.resolve(logPath)}`, LS.eSYS);
}

function handleConsoleArgs(args): string {
    if (typeof(args) === 'string')
        return args;
    if (!Array.isArray(args))
        return JSON.stringify(args, null, 0);

    let first: boolean = true;
    let value: string = '';
    for (const arg of args) {
        if (first)
            first = false;
        else
            value += ', ';

        if (typeof(arg) === 'string')
            value += arg;
        else
            value += JSON.stringify(arg);
    }
    return value;
}

configureLogger(null);