/* eslint-disable @typescript-eslint/no-explicit-any */

import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { Config } from '../config';
import { ASL, LocalStore } from './localStore';

let logger: winston.Logger;
export enum LS { // logger section
    eAUDIT, // audit
    eAUTH,  // authentication
    eCACHE, // cache
    eCOLL,  // collections
    eCONF,  // config
    eDB,    // database
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

function loggerSectionName(eLogSection: LS | undefined): string {
    switch (eLogSection) {
        case LS.eAUDIT: return 'AUD';
        case LS.eAUTH:  return 'ATH';
        case LS.eCACHE: return 'CCH';
        case LS.eCOLL:  return 'COL';
        case LS.eCONF:  return 'CNF';
        case LS.eDB:    return 'DB ';
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
            new winston.transports.File({
                filename: path.join(logPath, 'PackratCombined.log'),
                maxsize: 10485760 // 10MB
            }),
            new winston.transports.File({
                filename: path.join(logPath, 'PackratError.log'),
                level: 'error',
                maxsize: 10485760 // 10MB
            }),
        ]
    });

    // For the time being, let's emit logs to the Console in production, for use in debugging
    // /* istanbul ignore else */
    // if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console());
    // }

    try {
        /* istanbul ignore if */
        if (!fs.existsSync(logPath))
            fs.mkdirSync(logPath);
    } catch (error) /* istanbul ignore next */ {
        logger.error(error);
    }

    info('**************************', LS.eSYS);
    info(`Writing logs to ${path.resolve(logPath)}`, LS.eSYS);
}

configureLogger(null);
