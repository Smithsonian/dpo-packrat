import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { Config } from '../config';

export type Logger = winston.Logger;
export let logger: Logger;
let LoggerRequestID: number = 1;

function configureLogger(logPath: string | null): void {
    /* istanbul ignore if */
    if (logger)
        return;

    /* istanbul ignore else */
    if (!logPath)
        logPath = Config.log.root ? Config.log.root : /* istanbul ignore next */ './var/logs';

    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
        logger = winston.createLogger({
            level: 'verbose',
            format: winston.format.combine(
                winston.format.errors({ stack: true }), // emit stack trace when Error objects are passed in
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                /*
                // winston.format.colorize(),
                winston.format.json()
                */
                // winston.format.simple(),
                winston.format.printf((info) => {
                    const stack: string = info.stack ? ` ${info.stack}` : '';
                    return `${info.timestamp} ${info.level}: ${info.message}${stack}`;
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

        logger.add(new winston.transports.Console({
            // format: winston.format.simple(), // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
            format: winston.format.combine(
                winston.format.errors({ stack: true }), // emit stack trace when Error objects are passed in
                // winston.format.timestamp(),
                winston.format.colorize(),
                winston.format.simple()
            )
        }));
    } else {
        logger = winston.createLogger({
            level: 'verbose',
            format: winston.format.combine(
                winston.format.errors({ stack: true }), // emit stack trace when Error objects are passed in
                winston.format.timestamp(),
                winston.format.json()
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

/// Use this method to retrieve a logger that prepends a "request ID" to the logfile output
/// Each call to this method will increment the request ID -- so stash and reuse the returned
/// logger within the context of the current request
export function getRequestLogger(): winston.Logger {
    return logger.child({ requestID: LoggerRequestID++ });
}

/*
function plainFormat(info) {
    const formattedDate = info.timestamp.replace('T', ' ').replace('Z', '');
    return `${formattedDate}: ${info.level} ${info.message};`;
}
*/