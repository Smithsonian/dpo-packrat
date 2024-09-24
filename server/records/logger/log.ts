/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createLogger, format, transports } from 'winston';
import * as path from 'path';
import * as fs from 'fs';

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
    eNAV    = 'NAV',   // navigation
    eRPT    = 'RPT',   // report
    eSTR    = 'STORE', // storage
    eSYS    = 'SYS',   // system/utilities
    eTEST   = 'TEST',  // test code
    eWF     = 'WF',    // workflow
    eNONE   = '*****', // none specified ... don't use this!
}

interface LoggerContext {
    section: string | null;
    caller: string | null;
    environment: 'prod' | 'dev';
    idUser: number;
    idRequest: number;
}
interface LogEntry {
    timestamp: string;
    message: string;
    data?: any;
    level: string;
    audit: boolean;
    context: LoggerContext;
}

// Simulate __dirname in ES module scope
// import { fileURLToPath } from 'url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

export class Logger {
    private static logger: any;
    private static logDir: string = path.join(__dirname, 'Logs');
    private static environment: 'prod' | 'dev' = 'dev';

    private static getLogFilePath(): string {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const logDir = path.join(this.logDir, `${year}`, `${month}`);

        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        return path.join(logDir, `PackratLog_${year}-${month}-${day}.log`);
    }

    public static configure(logDirectory: string, env: 'prod' | 'dev'): void {
        this.logDir = logDirectory;
        this.environment = env;

        // we want a very specific order for the outputted JSON so we use a custom format to
        // ensure fields are printed in a specific order to improve readability
        const customJsonFormat = format.combine(
            format.timestamp(),
            format.printf((info) => {
                // eslint-disable-next-line no-control-regex
                const level = info.level.replace(/\u001b\[\d{2}m/g, ''); // Remove ANSI color codes

                // Arrange the properties in the desired order
                const log = {
                    timestamp: new Date(info.timestamp).toISOString(), // UTC timestamp
                    level,
                    message: info.message,
                    data: info.data,
                    context: info.context
                };
                return JSON.stringify(log);
            })
        );

        // Resolve relative paths to absolute paths using the current directory
        if (!path.isAbsolute(logDirectory)) {
            logDirectory = path.resolve(__dirname, logDirectory);
        }

        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }

        const fileTransport = new transports.File({
            filename: this.getLogFilePath(),
            format: customJsonFormat
        });

        const consoleTransport = new transports.Console({
            format: format.combine(
                format.colorize(),
                customJsonFormat
            )
        });

        // Use both transports: console in dev mode, and file transport for file logging
        this.logger = createLogger({
            level: 'debug', // Logging all levels
            transports: env === 'dev' ? [fileTransport, consoleTransport] : [fileTransport]
        });
    }

    // generic routine for printing to the log
    private static log(level: string, message: string, data: any, audit: boolean, context: { section: LogSection, caller?: string, idUser?: number, idRequest?: number }) {
        // create our object to submit to the logger with our structured format
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            message,
            data,
            level,
            audit,
            context: {
                section: context.section,
                caller: context.caller ?? null,
                environment: this.environment,
                idUser: context.idUser ?? -1,
                idRequest: context.idRequest ?? -1
            }
        };

        // Logging the JSON formatted log entry
        this.logger.log(level, entry);
    }

    // wrappers for each level of log
    public static critical(section: LogSection, message: string, data: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): void {
        this.log('critical', message, data, audit, { section, caller, idUser, idRequest });
    }
    public static error(section: LogSection, message: string, data: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): void {
        this.log('error', message, data, audit, { section, caller, idUser, idRequest });
    }
    public static warning(section: LogSection, message: string, data: any,  caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): void {
        this.log('warn', message, data, audit, { section, caller, idUser, idRequest });
    }
    public static info(section: LogSection, message: string, data: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): void {
        this.log('info', message, data, audit, { section, caller, idUser, idRequest });
    }
    public static debug(section: LogSection, message: string, data: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): void {
        this.log('debug', message, data, audit, { section, caller, idUser, idRequest });
    }
}
