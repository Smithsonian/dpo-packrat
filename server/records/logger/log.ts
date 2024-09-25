/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createLogger, format, transports } from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// Simulate __dirname in ES module scope
// import { fileURLToPath } from 'url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

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

// our types
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

// helper to get speecific color codes for text out in the console
export const getTextColorCode = (color?: string): string => {

    // if nothing provided return closing code
    if(!color)
        return '\x1b[0m';

    switch(color.toLowerCase()) {
        case 'reset':       return '\x1b[0m';
        case 'bright':      return '\x1b[1m';
        case 'dim':         return '\x1b[2m';
        case 'underscore':  return '\x1b[4m';
        case 'blink':       return '\x1b[5m';
        case 'reverse':     return '\x1b[7m';
        case 'hidden':      return '\x1b[8m';

        // colors tied to levels for easy lookup
        case 'critical':    return '\x1b[35m';
        case 'error':       return '\x1b[31m';
        case 'warn':        return '\x1b[33m';
        case 'info':        return '\x1b[32m';
        case 'debug':       return '\x1b[37m';

        // text color
        case 'fg-black':    return '\x1b[30m';
        case 'fg-red':      return '\x1b[31m';
        case 'fg-green':    return '\x1b[32m';
        case 'fg-yellow':   return '\x1b[33m';
        case 'fg-blue':     return '\x1b[34m';
        case 'fg-magenta':  return '\x1b[35m';
        case 'fg-cyan':     return '\x1b[36m';
        case 'fg-white':    return '\x1b[37m';

        // highlight/background color
        case 'bg-black':    return '\x1b[40m';
        case 'bg-red':      return '\x1b[41m';
        case 'bg-green':    return '\x1b[42m';
        case 'bg-yellow':   return '\x1b[43m';
        case 'bg-blue':     return '\x1b[44m';
        case 'bg-magenta':  return '\x1b[45m';
        case 'bg-cyan':     return '\x1b[46m';
        case 'bg-white':    return '\x1b[47m';

        default:
            return '\x1b[37m';
    }
};

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

    public static configure(logDirectory: string, env: 'prod' | 'dev'): { success: boolean; message?: string } {
        this.logDir = logDirectory;
        this.environment = env;

        try {
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

            // when outputting to the console/terminal we want cleaner, single-line logs so it's easier
            // to follow visually.
            const customConsoleFormat = format.printf((info) => {
                const timestamp: string = new Date(info.timestamp).toISOString().replace('T', ' ').replace('Z', '').split('.')[0]; // Removes milliseconds;
                const requestId: string = info.context.requestId ? `[${info.context.requestId}]` : '[00000]';
                const userId: string = info.context.userId ? `U${info.context.userId}` : 'U---';
                const section: string = info.context.section ? info.context.section.padStart(5) : '-----';
                const message: string = info.message;
                const caller: string | undefined = (info.context.caller) ? `[${info.context.caller}] ` : undefined;

                // to get right-aligned, colored levels we need to strip away any hidden colorization codes
                // and use that to see how long the actual level text is. From there we determine how much
                // padding is needed to right-align things. This is necessary because Winston's colorization
                // code alters the formatting/lengths of the level stripping all whitespace.
                const level: string = info.level.toLowerCase();
                // eslint-disable-next-line no-control-regex
                const levelRaw: string = info.level.replace(/\u001b\[.*?m/g, '');
                const levelPad: string = (levelRaw.length<6) ? ' '.repeat(6-levelRaw.length) : '';

                // Format data fields in parenthesis
                let dataFields: string = '';
                if (info.data) {
                    const dataEntries = Object.entries(info.data).map(([key, value]) => `${key}: ${value}`);
                    dataFields = `${getTextColorCode('dim')}(${dataEntries.join(' | ')})${getTextColorCode()}`;
                }

                // Build the formatted log message
                return `${timestamp} ${requestId} ${userId} ${section} ${levelPad}${level}: ${(caller ?? '')}${message} ${dataFields}`;
            });

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
                    format.timestamp(),
                    format.colorize(),
                    customConsoleFormat
                )
            });

            // Use both transports: console in dev mode, and file transport for file logging
            this.logger = createLogger({
                level: 'debug', // Logging all levels
                transports: env === 'dev' ? [fileTransport, consoleTransport] : [fileTransport]
            });
        } catch(error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : String(error)
            };
        }

        return { success: true, message: `(${env}) configured Logger. Sending to file ${(env==='dev') ? 'and console' : ''}` };
    }

    // generic routine for printing to the log
    private static log(level: string, message: string, data: any, audit: boolean, context: { section: LogSection, caller?: string, idUser?: number, idRequest?: number }): void {
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
