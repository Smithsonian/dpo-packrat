import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { Config } from '../config';
import { ASL, LocalStore } from './localStore';

export type Logger = winston.Logger;
export let logger: Logger;

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
                const reqID: string = idRequest ? (idRequest <= 99999 ? ('00000' + idRequest).slice(-5) : idRequest.toString()) : ' --- ';
                const stack: string = info.stack ? ` ${info.stack}` : '';
                return `${info.timestamp} [${reqID}] ${info.level}: ${info.message}${stack}`;
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

    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
        logger.add(new winston.transports.Console({
            // format: winston.format.simple(), // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
            format: winston.format.combine(
                winston.format.errors({ stack: true }), // emit stack trace when Error objects are passed in
                winston.format.colorize(),
                winston.format.simple()
            )
        }));
    }

    try {
        /* istanbul ignore if */
        if (!fs.existsSync(logPath))
            fs.mkdirSync(logPath);
    } catch (error) /* istanbul ignore next */ {
        logger.error(error);
    }

    logger.info('**************************');
    logger.info(`Writing logs to ${path.resolve(logPath)}`);
}

configureLogger(null);
