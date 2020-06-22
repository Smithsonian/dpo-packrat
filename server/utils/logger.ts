import * as winston from 'winston';
import * as path from 'path';

export type Logger = winston.Logger;
export let logger: Logger;
let LoggerRequestID: number = 1;

/// Call this method once!
export function configureLogger(logPath: string): void {
    logger = winston.createLogger({
        level: 'verbose',
        format: winston.format.combine(
            winston.format.errors({ stack: true }), // emit stack trace when Error objects are passed in
            winston.format.timestamp(),
            // winston.format.colorize(),
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

    if (process.env.NODE_ENV !== 'production') {
        logger.add(new winston.transports.Console({
            // format: winston.format.simple(), // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
            format: winston.format.combine(
                winston.format.errors({ stack: true }), // emit stack trace when Error objects are passed in
                winston.format.timestamp(),
                winston.format.colorize(),
                winston.format.prettyPrint()
            )
        }));
    }
}

/// Use this method to retrieve a logger that prepends a "request ID" to the logfile output
/// Each call to this method will increment the request ID -- so stash and reuse the returned
/// logger within the context of the current request
export function getRequestLogger(): winston.Logger {
    return logger.child({ requestID: LoggerRequestID++ });
}

/*
import { createLogger, format, transports } from 'winston';

const { combine, timestamp, prettyPrint, colorize, errors,  } = format;


const logger = createLogger({
  format: combine(
    errors({ stack: true }), // <-- use errors format
    colorize(),
    timestamp(),
    prettyPrint()
  ),
  transports: [new transports.Console()],
});

or

const errorStackTracerFormat = winston.format(info => {
    if (info.meta && info.meta instanceof Error) {
        info.message = `${info.message} ${info.meta.stack}`;
    }
    return info;
});

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.splat(), // Necessary to produce the 'meta' property
        errorStackTracerFormat(),
        winston.format.simple()
    )
});

or

const errorStackFormat = winston.format(info => {
  if (info instanceof Error) {
    return Object.assign({}, info, {
      stack: info.stack,
      message: info.message
    })
  }
  return info
})

const logger = winston.createLogger({
  transports: [ ... ],
  format: winston.format.combine(errorStackFormat(), myFormat)
})
*/