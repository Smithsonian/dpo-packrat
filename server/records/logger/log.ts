/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createLogger, format, transports, addColors } from 'winston';
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
    eSEC    = 'SEC',   // security
    eNONE   = '*****', // none specified ... don't use this!
}

// our types
interface LoggerContext {
    section: string | null;
    caller: string | null;
    environment: 'prod' | 'dev';
    idUser: number | undefined;
    idRequest: number | undefined;
}
interface LogEntry {
    timestamp: string;
    message: string;
    data?: any;
    level: string;
    audit: boolean;
    context: LoggerContext;
}
interface ProfileRequest {
    startTime: Date,
    logEntry: LogEntry
}
type DataType = string | number | boolean | object | any[]; // valid types for our 'data' field

// Simulate __dirname in ES module scope
// import { fileURLToPath } from 'url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

export class Logger {
    private static logger: any;
    private static logDir: string = path.join(__dirname, 'Logs');
    private static environment: 'prod' | 'dev' = 'dev';
    private static requests: Map<string, ProfileRequest> = new Map<string, ProfileRequest>();

    public static configure(logDirectory: string, env: 'prod' | 'dev'): { success: boolean; message: string } {
        this.logDir = logDirectory;
        this.environment = env;

        const customLevels = {
            levels: {
                // levels set to RFC5424 standard  (https://datatracker.ietf.org/doc/html/rfc5424)
                crit:   2,
                error:  3,
                warn:   4,
                info:   6,
                debug:  7,
                perf:   10, // used specifically for metreix/performance timers
            },
            // available colors: black, red, green, yellow, blue, magenta, cyan, white, gray, grey
            // available styles: bold, dim, italic, underline, inverse, hidden, strikethrough
            colors: {
                crit:   'bold magenta',
                error:  'red',
                warn:   'bold yellow',
                info:   'cyan',
                debug:  'gray',
                perf:   'green'
            }
        };

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
                const requestId: string = (info.context.idRequest && info.context.idRequest>=0) ? `[${String(info.context.idRequest).padStart(5, '0')}]` : '[00000]';
                const userId: string = (info.context && info.context.idUser>=0) ? `U${String(info.context.idUser).padStart(3, '0')}` : 'U----';
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
                    dataFields = `${this.getTextColorCode('dim')}(${this.processData(info.data)})${this.getTextColorCode()}`;
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
                level: 'perf', // Logging all levels
                levels: customLevels.levels,
                transports: env === 'dev' ? [fileTransport, consoleTransport] : [fileTransport]
            });

            // add our custom colors as well
            addColors(customLevels.colors);
        } catch(error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : String(error)
            };
        }

        return { success: true, message: `(${env}) configured Logger. Sending to file ${(env==='dev') ? 'and console' : ''}` };
    }

    //#region UTILS
    // build our log entry structure/object
    private static getLogEntry(level: string, message: string, data: any, audit: boolean, context: { section: LogSection, caller?: string, idUser?: number, idRequest?: number }): LogEntry {
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
                idUser: context.idUser,
                idRequest: context.idRequest
            }
        };
        return entry;
    }
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

    // processing of our 'data' field
    private static processData(data: DataType): string {
        // If data is a primitive type, return it as a string
        if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
            return data.toString();
        }

        // If data is an array, join elements with commas
        if (Array.isArray(data)) {
            return data.map(item => this.processData(item)).join(', ');
        }

        // If data is an object, flatten it and convert to a string of key/value pairs
        if (typeof data === 'object' && data !== null) {
            const flatObject = this.flattenObject(data);
            return Object.entries(flatObject)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
        }

        return '';
    }
    private static flattenObject(obj: object, prefix = ''): Record<string, string> {
        return Object.keys(obj).reduce((acc, key) => {
            const newKey = prefix ? `${prefix}.${key}` : key; // Handle nested keys with dot notation
            const value = (obj as Record<string, any>)[key];

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.assign(acc, this.flattenObject(value, newKey)); // Recursively flatten nested objects
            } else {
                acc[newKey] = value.toString(); // Assign non-object values directly
            }

            return acc;
        }, {} as Record<string, string>);
    }

    // helper to get specific color codes for text out in the console
    private static getTextColorCode(color?: string): string {

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
    }
    //#endregion

    //#region LOG
    // wrappers for each level of log
    public static critical(section: LogSection, message: string, data: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): void {
        this.logger.log(this.getLogEntry('crit', message, data, audit, { section, caller, idUser, idRequest }));
    }
    public static error(section: LogSection, message: string, data: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): void {
        this.logger.log(this.getLogEntry('error', message, data, audit, { section, caller, idUser, idRequest }));
    }
    public static warning(section: LogSection, message: string, data: any,  caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): void {
        this.logger.log(this.getLogEntry('warn', message, data, audit, { section, caller, idUser, idRequest }));
    }
    public static info(section: LogSection, message: string, data: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): void {
        this.logger.log(this.getLogEntry('info', message, data, audit, { section, caller, idUser, idRequest }));
    }
    public static debug(section: LogSection, message: string, data: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): void {
        this.logger.log(this.getLogEntry('debug', message, data, audit, { section, caller, idUser, idRequest }));
    }
    //#endregion

    //#region PROFILING
    public static profile(key: string, section: LogSection, message: string, data?: any, caller?: string, idUser?: number, idRequest?: number): { success: boolean, message: string } {

        // make sure we don't have the same
        if(this.requests.has(key)===true)
            return { success: false, message: 'profile request key already created.' };

        // otherwise, create our request entry for performance level
        const logEntry: LogEntry = this.getLogEntry('perf', message, data, false, { section, caller, idUser, idRequest } );
        const profileRequest: ProfileRequest = {
            startTime: new Date(),
            logEntry,
        };
        this.requests.set(key,profileRequest);

        return { success: true, message: 'created profile request' };
    }
    public static profileEnd(key: string): { success: boolean, message: string } {

        // get our request and make sure it's valid
        const profileRequest: ProfileRequest | undefined = this.requests.get(key);
        if(!profileRequest)
            return { success: false, message: 'cannot find profile request' };

        // Pad with leading zeros for display
        const elapsedMilliseconds: number = new Date().getTime() - profileRequest.startTime.getTime();
        const totalSeconds: number = Math.floor(elapsedMilliseconds / 1000);
        const hours: string = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes: string = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds: string = String(totalSeconds % 60).padStart(2, '0');
        const milliseconds: string = String((elapsedMilliseconds % 1000) * 10).padStart(4, '0');

        // get our ellapsed time and update our data/message with it
        profileRequest.logEntry.message += ` {${hours}:${minutes}:${seconds}:${milliseconds}}`;
        profileRequest.logEntry.timestamp = new Date().toISOString();

        if(profileRequest.logEntry.data)
            profileRequest.logEntry.data.profiler = elapsedMilliseconds;
        else
            profileRequest.logEntry.data = { profiler: elapsedMilliseconds };

        // log the results
        this.logger.log(profileRequest.logEntry);
        return { success: true, message: 'created profile request' };
    }
    //#endregion
}
