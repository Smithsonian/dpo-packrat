/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * TODO
 * - add support for function/method profiling using NPM inspector
 */
import { createLogger, format, transports, addColors } from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import { RateManager, RateManagerConfig, RateManagerMetrics, RateManagerResult } from '../utils/rateManager';
import { ENVIRONMENT_TYPE } from '../../config';
import { LogLevel, LogSection } from './logTypes';

// adjust our default event hanlder to support higher throughput. (default is 10)
require('events').EventEmitter.defaultMaxListeners = 50;
// import { EventEmitter } from 'events';
// EventEmitter.defaultMaxListeners = 50;

// Simulate __dirname in ES module scope. Needed when running outside of Packrat
// import { fileURLToPath } from 'url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

//#region TYPES & INTERFACES
export interface LoggerStats {
    counts: {
        profile: number,
        critical: number,
        error: number,
        warning: number,
        info: number,
        debug: number,
        total: number
    },
    metrics: {
        logRate: number,    // current logs per second
        logRateAvg: number, // rolling average of log rate
        logRateMax: number, // the maximum log rate achieved
    }
}

type DataType = string | number | boolean | object | any[]; // valid types for our 'data' field

interface LoggerContext {
    section: string | null;
    caller: string | null;
    environment: 'production' | 'development';
    idUser: number | undefined;
    idRequest: number | undefined;
}
interface LogEntry {
    timestamp: string;
    message: string;
    data?: any;
    level: LogLevel;
    audit: boolean;
    context: LoggerContext;
}
interface ProfileRequest {
    startTime: Date,
    logEntry: LogEntry
}

// declaring this empty for branding/clarity since it is used
// for instances that are not related to the RateManager
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface LoggerResult extends RateManagerResult {}

//#endregion

export class Logger {
    private static logger: any | null = null;
    private static logDir: string = path.join(__dirname, 'Logs');
    private static environment: ENVIRONMENT_TYPE = ENVIRONMENT_TYPE.DEVELOPMENT;
    private static requests: Map<string, ProfileRequest> = new Map<string, ProfileRequest>();
    private static stats: LoggerStats = {
        counts: { profile: 0, critical: 0, error: 0, warning: 0, info: 0, debug: 0, total: 0 },
        metrics: { logRate: 0, logRateAvg: 0, logRateMax: 0 }
    };
    private static debugMode: boolean = false;
    private static metricsIsRunning: boolean = false;
    private static rateManager: RateManager<LogEntry> | null =  null;

    //#region PUBLIC
    private static isActive(): boolean {
        // we're initialized if we have a logger running
        return (Logger.logger!=null);
    }
    public static configure(logDirectory: string, environment: ENVIRONMENT_TYPE, rateManager: boolean = true, targetRate?: number, burstRate?: number, burstThreshold?: number): LoggerResult {
        // we allow for re-assigning configuration options even if already running
        Logger.logDir = logDirectory;
        Logger.environment = environment;

        // if we want a rate limiter then we build it
        if(rateManager===true) {
            const rmConfig: RateManagerConfig<LogEntry> = {
                targetRate,
                burstRate,
                burstThreshold,
                onPost: Logger.postLogToWinston,
                onLog: ((success: boolean, message: string, data?: any, isDebug?: boolean)=>{
                    if(success===false)
                        Logger.error(LogSection.eSYS,'rate manager failed',message,data,'RateManager.Logger');
                    else if(isDebug===true)
                        Logger.debug(LogSection.eSYS,'rate manager',message,data,'RateManager.Logger');
                    else
                        Logger.info(LogSection.eSYS,'rate manager',message,data,'RateManager.Logger');
                })
            };

            // if we already have a manager we re-configure it (causes restart). otherwise, we create a new one
            if(Logger.rateManager)
                Logger.rateManager.setConfig(rmConfig);
            else {
                Logger.rateManager = new RateManager<LogEntry>(rmConfig);
            }
        } else if(Logger.rateManager) {
            // if we don't want a rate manager but have one, clean it up
            // Logger.rateManager.stopRateManager();
            Logger.rateManager = null;
        }

        // if we already have a logger skip creating another one
        if(Logger.isActive()===true)
            return { success: true, message: 'Winston logger already running' };

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
                const userId: string = (info.context && info.context.idUser>=0) ? `U${String(info.context.idUser).padStart(3, '0')}` : 'U---';
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
                    dataFields = `${Logger.getTextColorCode('dim')}(${Logger.processData(info.data)})${Logger.getTextColorCode()}`;
                }

                // Build the formatted log message
                return `${timestamp} ${requestId} ${userId} ${section} ${levelPad}${level}: ${(caller ?? '')}${message} ${dataFields}`;
            });

            // Resolve relative paths to absolute paths using the current directory
            if (!path.isAbsolute(logDirectory)) {
                logDirectory = path.resolve(__dirname, logDirectory);
            }

            if (!fs.existsSync(Logger.logDir)) {
                fs.mkdirSync(Logger.logDir, { recursive: true });
            }

            const fileTransport = new transports.File({
                filename: Logger.getLogFilePath(),
                format: customJsonFormat,
                // handleExceptions: false  // used to disable buffering for higher volume support at risk of errors
                maxsize: 150 * 1024 * 1024, // 150 MB in bytes
                maxFiles: 20,               // Keep a maximum of 20 log files (3GB)
                tailable: true              // Ensure the log files are named in a "rolling" way
            });

            const consoleTransport = new transports.Console({
                format: format.combine(
                    format.timestamp(),
                    format.colorize(),
                    customConsoleFormat
                ),
                // handleExceptions: false // used to disable buffering for higher volume support at risk of errors
            });

            // Use both transports: console in dev mode, and file transport for file logging
            Logger.logger = createLogger({
                level: 'perf', // Logging all levels
                levels: customLevels.levels,
                transports: environment===ENVIRONMENT_TYPE.DEVELOPMENT ? [fileTransport, consoleTransport] : [fileTransport],
                // exitOnError: false, // do not exit on exceptions. combines with 'handleExceptions' above
            });

            // add our events on failure
            Logger.logger.on('error', (err) => {
                Logger.fallback(LogLevel.CRITICAL,LogSection.eSYS,'Winston stream failed',err,undefined,'RecordKeeper.Logger');
            });
            Logger.logger.transports.forEach(t => {
                t.on('error', (err) => {
                    Logger.fallback(LogLevel.CRITICAL,LogSection.eSYS,'Winston transport failed',err,{ name: t.name, constructor: t.constructor.name },'RecordKeeper.Logger');
                });
            });
            // add our custom colors as well
            addColors(customLevels.colors);

            // start up our metrics tracker (sampel every 5 seconds, 10 samples per avgerage calc)
            Logger.trackLogMetrics(5000,10);
        } catch(error) {
            const errorMsg: string = error instanceof Error ? error.message : String(error);
            Logger.fallback(LogLevel.CRITICAL,LogSection.eSYS,'configure failed',errorMsg,undefined,'RecordKeeper.Logger');
            return {
                success: false,
                message: errorMsg
            };
        }

        return { success: true, message: `configured Logger. Sending to file ${(environment===ENVIRONMENT_TYPE.DEVELOPMENT) ? 'and console' : ''}` };
    }
    public static setDebugMode(value: boolean): void {
        Logger.debugMode = value;
    }
    public static getStats(): LoggerStats {
        Logger.stats.counts.total = (Logger.stats.counts.critical + Logger.stats.counts.error + Logger.stats.counts.warning + Logger.stats.counts.info + Logger.stats.counts.debug);
        return Logger.stats;
    }
    public static getStatus(): LoggerResult {

        if(Logger.isActive()===false)
            return { success: false, message: 'Logger not running' };

        // see if any transports are writable
        const transports: any[] = [ ];
        Logger.logger.transports.forEach(t => {
            transports.push({
                name: t.name,
                constructor: t.constructor.name,
                silent: t.silent,
                level: t.level,
                writeable: typeof t.write === 'function'
            });
        });
        const numActiveTransports: number = transports.filter(t => t.writeable).length;

        // grab manager metrics to get queue size (backpressure)
        const rateManagerMetrics: RateManagerMetrics | undefined = Logger.rateManager?.getMetrics();

        const result: LoggerResult = {
            success: true,
            message: 'Logger status',
            data: {
                isActive: Logger.isActive(),
                numTransports: numActiveTransports,
                path: Logger.logDir,
                queueSize: rateManagerMetrics?.queueLength ?? -1,
                transports,
                stats: Logger.getStats(),
            }
        };
        return result;
    }
    public static async waitForQueueToDrain(timeout: number = 10000): Promise<LoggerResult> {
        // wait for our queue to empty out
        if(!this.rateManager)
            return { success: false, message: 'no manager running' };

        const result = await this.rateManager.waitUntilIdle(timeout);
        if(!result.success)
            return { success: false, message: result.message, data: { queueSize: result.queueSize } };

        return { success: true, message: result.message };
    }
    public static safeInspect = (data: any) => {
        // safely inspect an object and output to the native console
        console.log(util.inspect(data, { depth: 4, colors: true }));
    };
    //#endregion

    //#region UTILS
    private static async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // build our log entry structure/object
    private static getLogEntry(level: LogLevel, message: string, reason: string,  data: any | undefined, audit: boolean, context: { section: LogSection, caller?: string, idUser?: number, idRequest?: number }): LogEntry {
        // create our data structure wrapping in reason if it exists
        const hasReason = reason && reason.trim().length > 0;
        const combinedData = hasReason
            ? { reason, ...(data ?? {}) }
            : data;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            message,
            data: combinedData,
            level,
            audit,
            context: {
                section: context.section,
                caller: context.caller ?? null,
                environment: Logger.environment,
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
        const logDir = path.join(Logger.logDir, `${year}`, `${month}`);

        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        return path.join(logDir, `PackratLog_${year}-${month}-${day}.log`);
    }

    // processing of our 'data' field
    private static processData(data: DataType): string {
        // If data is a primitive type, return it as a string
        let result: string;

        if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
            result = data.toString();
        } else if (Array.isArray(data)) {
            result = data.map(item => Logger.processData(item)).join(', ');
        } else if (typeof data === 'object' && data !== null) {
            const flatObject = Logger.flattenObject(data);
            result = Object.entries(flatObject)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
        } else {
            result = '';
        }

        // Truncate to 145 characters with ellipsis if needed
        return result.length > 145 ? result.slice(0, 142) + '...' : result;
    }
    private static flattenObject(obj: object, prefix = ''): Record<string, string> {
        return Object.keys(obj).reduce((acc, key) => {
            const newKey = prefix ? `${prefix}.${key}` : key; // Handle nested keys with dot notation
            let value = (obj as Record<string, any>)[key];

            if (typeof value === 'object' && value !== null && value !== undefined && !Array.isArray(value)) {
                Object.assign(acc, Logger.flattenObject(value, newKey)); // Recursively flatten nested objects
            } else {
                if(newKey==='error' && !value)
                    value = 'undefined error';
                acc[newKey] = value?.toString(); // Assign non-object values directly
            }

            return acc;
        }, {} as Record<string, string>);
    }

    // update our stats counter
    private static updateStats(entry: LogEntry): void {
        // we do this here so we can track when it actually gets posted if done by the rate manager
        switch(entry.level) {
            case 'crit':    Logger.stats.counts.critical++; break;
            case 'error':   Logger.stats.counts.error++; break;
            case 'warn':    Logger.stats.counts.warning++; break;
            case 'info':    Logger.stats.counts.info++; break;
            case 'debug':   Logger.stats.counts.debug++; break;
            case 'perf':    Logger.stats.counts.profile++; break;
        }
        Logger.stats.counts.total++;
    }
    private static async trackLogMetrics(interval: number, avgSamples: number): Promise<void> {

        // if already running, bail
        if(Logger.metricsIsRunning===true)
            return;
        Logger.metricsIsRunning = true;

        // make sure our interval and samples are valid
        interval = Math.max(interval, 1000);
        avgSamples = Math.max(avgSamples,5);

        const logRates: number[] = [];          // Store log rates to calculate rolling average
        const elapsedSeconds: number = interval/1000;

        const lastSample = {
            timestamp: new Date(),
            startSize: Logger.stats.counts.total
        };

        while(Logger.metricsIsRunning) {
            const currentSize: number = Logger.stats.counts.total;

            // Ensure no divide-by-zero and that log count is greater than last sample
            if (currentSize - lastSample.startSize > 0) {
                const newLogRate: number = (currentSize - lastSample.startSize) / elapsedSeconds;

                // see if we have a new maximum and assign the log rate
                Logger.stats.metrics.logRateMax = Math.max(Logger.stats.metrics.logRate,newLogRate);
                Logger.stats.metrics.logRate = newLogRate;

                // Track the log rate to calculate rolling average
                logRates.push(Logger.stats.metrics.logRate);

                // Maintain rolling average window size
                if(logRates.length > avgSamples) {
                    logRates.shift();  // Remove the oldest rate to keep the window size constant
                }

                // Calculate rolling average
                const totalLogRate = logRates.reduce((sum, rate) => sum + rate, 0);
                Logger.stats.metrics.logRateAvg = totalLogRate / logRates.length;

            } else {
                Logger.stats.metrics.logRate = 0;
            }

            lastSample.timestamp = new Date();
            lastSample.startSize = currentSize;

            if(Logger.debugMode===true)
                Logger.performance(LogSection.eSYS,'metrics update',undefined,{ ...Logger.stats.metrics },'RecordKeeper.Logger');

            await Logger.delay(interval);
        }

        Logger.metricsIsRunning = false;
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

    // remove circular dependencies from submitted data to be logged
    private static stripCircular = <T>(obj: T): T => {
        const seen = new WeakSet();
        return JSON.parse(JSON.stringify(obj, (_key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) return '[Circular]';
                seen.add(value);
            }
            return value;
        }));
    };
    //#endregion

    //#region LOG
    private static async postLog(entry: LogEntry): Promise<LoggerResult> {
        // see if we're configured/active
        if(Logger.isActive()===false || Logger.logger===null) {
            Logger.fallback(LogLevel.CRITICAL,LogSection.eSYS,'post log failed','no logger system',entry,'RecordKeeper.Logger');
            return { success: false, message: `cannot post message. no logger (${entry.message} | ${entry.context})` };
        }

        // if we're in debug mode we inspect all data coming in for circular dependencies
        if(Logger.debugMode===true)
            Logger.safeInspect(entry);

        // strip any circular dependencies
        const safeEntry = Logger.stripCircular(entry);

        // if we have the rate manager running, queue it up
        // otherwise just send to the logger
        if(Logger.rateManager)// && Logger.rateManager.isActive()===true)
            return Logger.rateManager.add(safeEntry);
        else {
            return Logger.postLogToWinston(safeEntry);
        }
    }
    private static async postLogToWinston(entry: LogEntry): Promise<LoggerResult> {
        // wrapping in a promise to ensure the logger finishes all transports
        // before moving on.
        return new Promise<LoggerResult>((resolve)=> {
            if(Logger.isActive()===false || Logger.logger===null) {
                Logger.fallback(LogLevel.CRITICAL,LogSection.eSYS,'post to Winston failed','no logger system',entry,'RecordKeeper.Logger');
                resolve({ success: false, message: `cannot post message. no logger (${entry.message} | ${entry.context})` });
                return;
            }

            Logger.logger.log(entry);
            Logger.updateStats(entry);
            resolve ({ success: true, message: 'posted message' });
        });
    }

    // wrappers for each level of log
    public static async critical(section: LogSection, message: string, reason?: string, data?: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): Promise<LoggerResult> {
        if(Logger.isActive()===false)
            return { success: false, message: 'cannot post log. no Logger. run configure' };

        return Logger.postLog(Logger.getLogEntry(LogLevel.CRITICAL, message, reason ?? '', data, audit, { section, caller, idUser, idRequest }));
    }
    public static async error(section: LogSection, message: string, reason?: string, data?: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): Promise<LoggerResult> {
        if(Logger.isActive()===false)
            return { success: false, message: 'cannot post log. no Logger. run configure' };

        return Logger.postLog(Logger.getLogEntry(LogLevel.ERROR, message, reason ?? '', data, audit, { section, caller, idUser, idRequest }));
    }
    public static async warning(section: LogSection, message: string, reason?: string, data?: any,  caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): Promise<LoggerResult> {
        if(Logger.isActive()===false)
            return { success: false, message: 'cannot post log. no Logger. run configure' };

        return Logger.postLog(Logger.getLogEntry(LogLevel.WARNING, message, reason ?? '', data, audit, { section, caller, idUser, idRequest }));
    }
    public static async info(section: LogSection, message: string, reason?: string, data?: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): Promise<LoggerResult> {
        if(Logger.isActive()===false)
            return { success: false, message: 'cannot post log. no Logger. run configure' };

        return Logger.postLog(Logger.getLogEntry(LogLevel.INFO, message, reason ?? '', data, audit, { section, caller, idUser, idRequest }));
    }
    public static async debug(section: LogSection, message: string, reason?: string, data?: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): Promise<LoggerResult> {
        if(Logger.isActive()===false)
            return { success: false, message: 'cannot post log. no Logger. run configure' };

        return Logger.postLog(Logger.getLogEntry(LogLevel.DEBUG, message, reason ?? '', data, audit, { section, caller, idUser, idRequest }));
    }
    public static async performance(section: LogSection, message: string, reason?: string, data?: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): Promise<LoggerResult> {
        if(Logger.isActive()===false)
            return { success: false, message: 'cannot post log. no Logger. run configure' };

        return Logger.postLog(Logger.getLogEntry(LogLevel.PERFORMANCE, message, reason ?? '', data, audit, { section, caller, idUser, idRequest }));
    }
    public static fallback(level: LogLevel, sec: LogSection, message: string, reason: string, data?: any, caller?: string): void {

        const timestamp: string = new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
        const section: string = sec ? sec.padStart(5) : '-----';
        const levelPad: string = (level.toString().length<6) ? ' '.repeat(6-level.toString().length) : '';

        if(reason.length>0)
            data = { reason, ...data };

        switch(level) {
            case LogLevel.CRITICAL:
            case LogLevel.ERROR:
                console.error(`${timestamp} [00000] U--- ${section} ${levelPad}${level}: [FALLBACK|${caller}] ${message} (${Logger.processData(data)})`);
                break;

            case LogLevel.WARNING:
                console.warn(`${timestamp} [00000] U--- ${section} ${levelPad}${level}: [FALLBACK|${caller}] ${message} (${Logger.processData(data)})`);
                break;

            case LogLevel.DEBUG:
                console.debug(`${timestamp} [00000] U--- ${section} ${levelPad}${level}: [FALLBACK|${caller}] ${message} (${Logger.processData(data)})`);
                break;

            case LogLevel.INFO:
            case LogLevel.PERFORMANCE:
                console.info(`${timestamp} [00000] U--- ${section} ${levelPad}${level}: [FALLBACK|${caller}] ${message} (${Logger.processData(data)})`);
                break;
        }
    }
    //#endregion

    //#region PROFILING
    public static async profile(key: string, section: LogSection, message: string, data?: any, caller?: string, idUser?: number, idRequest?: number): Promise<LoggerResult> {

        // make sure we don't have the same
        if(Logger.requests.has(key)===true)
            return { success: false, message: 'profile request key already created.' };

        // otherwise, create our request entry for performance level
        // pass in empty 'reason' string since message and data carries main information
        const logEntry: LogEntry = Logger.getLogEntry(LogLevel.PERFORMANCE, message, '', data, false, { section, caller, idUser, idRequest } );
        const profileRequest: ProfileRequest = {
            startTime: new Date(),
            logEntry,
        };
        Logger.requests.set(key,profileRequest);

        return { success: true, message: 'created profile request' };
    }
    public static async profileEnd(key: string): Promise<LoggerResult> {

        // get our request and make sure it's valid
        const profileRequest: ProfileRequest | undefined = Logger.requests.get(key);
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

        // log the results and cleanup.
        // we await so we can cleanup the request
        const result: LoggerResult = await Logger.postLog(profileRequest.logEntry);
        Logger.stats.counts.profile++;
        Logger.requests.delete(key);

        result.message = `${hours}:${minutes}:${seconds}:${milliseconds}`;
        return result;
    }
    public static async profileUpdate(key: string, data: any): Promise<LoggerResult> {
        // get our request and make sure it's valid
        const profile: ProfileRequest | undefined = Logger.requests.get(key);
        if(!profile)
            return { success: false, message: 'cannot find profile request' };

        // update our data
        if (!profile.logEntry.data || typeof profile.logEntry.data !== 'object') {
            profile.logEntry.data = {};
        }
        profile.logEntry.data = {
            ...profile.logEntry.data,
            ...data
        };

        return { success: true, message: 'updated profile request' };
    }
    //#endregion

    //#region TESTING
    private static randomLogEntry(index: number): LogEntry {
        const levels = ['crit', 'error', 'warn', 'info', 'debug'];
        const sectionMessages: Record<LogSection, string[]> = {
            [LogSection.eAUTH]: ['User login successful', 'Token expired', 'Password change requested'],
            [LogSection.eCACHE]: ['Cache miss for key', 'Cache invalidated', 'Cache hit'],
            [LogSection.eCOLL]: ['Collection loaded', 'Item added to collection', 'Collection view updated'],
            [LogSection.eCON]: ['Console output redirected', 'System reboot initiated'],
            [LogSection.eCONF]: ['Configuration file loaded', 'Settings updated'],
            [LogSection.eDB]: ['Database connection established', 'Query executed successfully', 'Transaction committed'],
            [LogSection.eEVENT]: ['Event listener triggered', 'Event dispatched', 'Event queued'],
            [LogSection.eGQL]: ['GraphQL query executed', 'Mutation resolved', 'Subscription updated'],
            [LogSection.eHTTP]: ['API request received', 'HTTP response sent', 'Error in HTTP request'],
            [LogSection.eJOB]: ['Job scheduled successfully', 'Job completed', 'Job failed to run'],
            [LogSection.eMETA]: ['Metadata processed', 'Metadata updated', 'Metadata export successful'],
            [LogSection.eMIG]: ['Database migration started', 'Migration completed', 'Migration failed'],
            [LogSection.eNAV]: ['Page navigation successful', 'Navigation route updated', 'Navigation error occurred'],
            [LogSection.eRPT]: ['Report generated', 'Report export completed', 'Report failed'],
            [LogSection.eSTR]: ['File upload completed', 'Storage quota exceeded', 'File retrieval successful'],
            [LogSection.eSYS]: ['System health check passed', 'System restarted', 'Resource usage optimized'],
            [LogSection.eTEST]: ['Unit tests passed', 'Integration test failed', 'Test suite executed'],
            [LogSection.eWF]: ['Workflow step approved', 'Task assigned', 'Workflow completed'],
            [LogSection.eSEC]: ['Encryption successful', 'Unauthorized access attempt', 'Security policy updated'],
            [LogSection.eNONE]: ['No section assigned']
        };
        const sectionCallers: Record<LogSection, string[]> = {
            [LogSection.eAUTH]: ['AuthService', 'LoginHandler', 'TokenValidator'],
            [LogSection.eCACHE]: ['CacheManager', 'RedisClient', 'MemoryStore'],
            [LogSection.eCOLL]: ['CollectionController', 'CollectionView', 'ItemHandler'],
            [LogSection.eCON]: ['ConsoleOutput', 'ConsoleWriter'],
            [LogSection.eCONF]: ['ConfigLoader', 'ConfigManager'],
            [LogSection.eDB]: ['DBConnection', 'QueryRunner', 'TransactionHandler'],
            [LogSection.eEVENT]: ['EventDispatcher', 'EventListener', 'EventQueue'],
            [LogSection.eGQL]: ['GraphQLHandler', 'QueryResolver', 'MutationExecutor'],
            [LogSection.eHTTP]: ['HTTPRequest', 'HTTPResponse', 'APIController'],
            [LogSection.eJOB]: ['JobScheduler', 'JobRunner'],
            [LogSection.eMETA]: ['MetadataReader', 'MetadataWriter'],
            [LogSection.eMIG]: ['MigrationRunner', 'DBMigrator'],
            [LogSection.eNAV]: ['Navigator', 'BreadcrumbGenerator'],
            [LogSection.eRPT]: ['ReportBuilder', 'ReportViewer'],
            [LogSection.eSTR]: ['StorageHandler', 'FileUploader'],
            [LogSection.eSYS]: ['SystemMonitor', 'SystemUtility'],
            [LogSection.eTEST]: ['TestRunner', 'TestSuite'],
            [LogSection.eWF]: ['WorkflowEngine', 'TaskExecutor'],
            [LogSection.eSEC]: ['SecurityManager', 'EncryptionHandler'],
            [LogSection.eNONE]: ['UnknownCaller']
        };
        const sectionData: Record<LogSection, any> = {
            [LogSection.eAUTH]: { user: 'john_doe', token: 'abc123', status: 'expired' },
            [LogSection.eCACHE]: { key: 'cacheKey123', action: 'invalidate', status: 'success' },
            [LogSection.eCOLL]: { collectionId: 42, itemCount: 100, status: 'loaded' },
            [LogSection.eCON]: { output: 'System reboot initiated', status: 'in progress' },
            [LogSection.eCONF]: { configName: 'app.config', modified: true },
            [LogSection.eDB]: { query: 'SELECT * FROM users', executionTime: '120ms', status: 'success' },
            [LogSection.eEVENT]: { eventId: 101, type: 'click', target: 'button' },
            [LogSection.eGQL]: { query: '{ user { id, name } }', responseTime: '50ms' },
            [LogSection.eHTTP]: { method: 'POST', url: '/api/login', statusCode: 200 },
            [LogSection.eJOB]: { jobId: 999, type: 'backup', status: 'completed' },
            [LogSection.eMETA]: { metadataType: 'image', fileSize: '5MB' },
            [LogSection.eMIG]: { migrationId: 'mig_2024_01', status: 'successful' },
            [LogSection.eNAV]: { route: '/dashboard', previousRoute: '/login' },
            [LogSection.eRPT]: { reportId: 34, format: 'PDF', status: 'generated' },
            [LogSection.eSTR]: { fileId: 'file_12345', action: 'upload', status: 'completed' },
            [LogSection.eSYS]: { cpuUsage: '75%', memoryUsage: '3GB', uptime: '5h' },
            [LogSection.eTEST]: { testSuite: 'UnitTests', passed: true },
            [LogSection.eWF]: { workflowId: 'wf_2001', step: 'approval', status: 'pending' },
            [LogSection.eSEC]: { operation: 'encrypt', algorithm: 'AES', success: true },
            [LogSection.eNONE]: {}
        };

        const randomLevel = levels[Math.floor(Math.random() * levels.length)];
        const randomSection = Object.values(LogSection)[Math.floor(Math.random() * Object.values(LogSection).length)];
        const randomCaller = sectionCallers[randomSection][Math.floor(Math.random() * sectionCallers[randomSection].length)];
        const randomMessage = sectionMessages[randomSection][Math.floor(Math.random() * sectionMessages[randomSection].length)];

        // compose our message
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            message: randomMessage,
            level: randomLevel as LogLevel,
            audit: Math.random() < 0.5,
            context: {
                section: randomSection,
                caller: `${String(index).padStart(5,'0')} - `+randomCaller,
                environment: Math.random() < 0.5 ? 'production' : 'development',
                idUser: Math.random() < 0.5 ? Math.floor(100 + Math.random() * 900) : undefined,
                idRequest: Math.random() < 0.5 ? Math.floor(Math.random() * 100000) : undefined,
            }
        };

        // ensure the error/critical states have expected data
        if (['error', 'crit'].includes(randomLevel))
            logEntry.data = { error: 'An error occurred', ...sectionData[randomSection], index };
        else if (Math.random() < 0.5) // Random chance to add 'data' for other levels
            logEntry.data = { ...sectionData[randomSection], index };

        return logEntry;
    }
    public static async testLogs(numLogs: number): Promise<LoggerResult> {
        // NOTE: given the static assignment this works best when nothing else is feeding logs
        const hasRateManager: boolean = (Logger.rateManager) ? (Logger.rateManager!=null) : false;
        const config: RateManagerConfig<LogEntry> | null = Logger.rateManager?.getConfig() ?? null;

        // create our profiler
        // we use a random string in case another test or profile is run to avoid collisisons
        const profileKey: string = `LogTest_${Math.random().toString(36).substring(2, 6)}`;
        await Logger.profile(profileKey, LogSection.eHTTP, `Log test: ${new Date().toLocaleString()}`, {
            numLogs,
            rateManager: hasRateManager,
            ...(hasRateManager === true && config && {
                config: (({ onPost: _onPost, ...rest }) => rest)(config)  // Exclude onPost
            })
        },'Logger.test');

        // capture the current total count so we can adjust in case other events are going on
        const startCount: number = Logger.stats.counts.total;

        // test our logging
        for(let i=0; i<numLogs; ++i)
            Logger.postLog(Logger.randomLogEntry(i));

        // cycle through waiting for use to finish posting all logs
        const timeout = Math.max(numLogs * 20,10000); //assuming max 20ms per log, and wait at least 10s
        const startTime = Date.now();
        while ((Logger.stats.counts.total - startCount) < numLogs) {

            if(Logger.debugMode)
                Logger.debug(LogSection.eSYS,'test logs',`waiting for logs to post: ${(Logger.stats.counts.total - startCount)}`,{ numLogs },'RecordKeeper.Logger');

            // Check if timeout has been reached
            if (Date.now() - startTime > timeout) {
                Logger.error(LogSection.eSYS,'test logs failed','Timeout reached while waiting for logs',{},'RecordKeeper.Logger');
                break;
            }

            // Wait for 1 second before checking again
            await Logger.delay(1000);
        }

        // close our profiler and return results
        const result = await Logger.profileEnd(profileKey);
        return { success: true, message: `finished testing ${numLogs} logs. (time: ${result.message} | maxRate: ${Logger.stats.metrics.logRateMax} | avgRate: ${Logger.rateManager?.getMetrics().rates.average ?? -1})` };
    }
    //#endregion
}

export { LogSection, LogLevel };