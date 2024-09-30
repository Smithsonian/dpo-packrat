/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createLogger, format, transports, addColors } from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// adjust our default event hanlder to support higher throughput. (default is 10)
require('events').EventEmitter.defaultMaxListeners = 50;
// import { EventEmitter } from 'events';
// EventEmitter.defaultMaxListeners = 50;

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
export interface LoggerStats {
    counts: {
        profile: number,
        critical: number,
        error: number,
        warning: number,
        info: number,
        debug: number,
        total: number
    }
}
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
interface LoadBalancerConfig {
    targetRate: number,     // targeted logs per second (200-2000)
    burstRate: number,      // target rate when in burst mode and playing catchup
    burstThreshold: number, // when queue is bigger than this size, trigger 'burst mode'
    staggerLogs: boolean,   // do we spread logs out over each interval or submit as a single batch
    minInterval: number,    // minimum duration for a batch/interval in ms. (higher values use less resources)
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
    private static stats: LoggerStats = { counts: { profile: 0, critical: 0, error: 0, warning: 0, info: 0, debug: 0, total: 0 } };
    private static lbIsRunning: boolean = false;
    private static lbQueue: LogEntry[] = [];
    private static lbQueueLocked: boolean = false;
    private static lbConfig: LoadBalancerConfig = {
        targetRate: 200,
        burstRate: 1000,
        burstThreshold: 3000,
        staggerLogs: true,
        minInterval: 100,
    };

    public static configure(logDirectory: string, env: 'prod' | 'dev', loadBalancer: boolean = true, targetRate?: number, burstRate?: number, burstThreshold?: number, staggerLogs?: boolean): { success: boolean; message: string } {
        this.logDir = logDirectory;
        this.environment = env;
        this.lbConfig.targetRate = targetRate ?? this.lbConfig.targetRate;
        this.lbConfig.burstRate = burstRate ?? this.lbConfig.burstRate;
        this.lbConfig.burstThreshold = burstThreshold ?? this.lbConfig.burstThreshold;
        this.lbConfig.staggerLogs = staggerLogs ?? this.lbConfig.staggerLogs;

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
                format: customJsonFormat,
                // handleExceptions: false // used to disable buffering for higher volume support at risk of errors
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
            this.logger = createLogger({
                level: 'perf', // Logging all levels
                levels: customLevels.levels,
                transports: env === 'dev' ? [fileTransport, consoleTransport] : [fileTransport],
                // exitOnError: false, // do not exit on exceptions. combines with 'handleExceptions' above
            });

            // add our custom colors as well
            addColors(customLevels.colors);

            // start our load balancer if needed
            if(loadBalancer===true)
                this.startLoadBalancer();
        } catch(error) {
            this.stopLoadBalancer();
            return {
                success: false,
                message: error instanceof Error ? error.message : String(error)
            };
        }

        return { success: true, message: `(${env}) configured Logger. Sending to file ${(env==='dev') ? 'and console' : ''}` };
    }
    public static getStats(): LoggerStats {
        this.stats.counts.total = (this.stats.counts.critical + this.stats.counts.error + this.stats.counts.warning + this.stats.counts.info + this.stats.counts.debug);
        return this.stats;
    }

    //#region UTILS
    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

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

    // update our stats counter
    private static updateStats(entry: LogEntry): void {
        // we do this here so we can track when it actually gets posted if done by the load balancer
        switch(entry.level) {
            case 'crit':    this.stats.counts.critical++; break;
            case 'error':   this.stats.counts.error++; break;
            case 'warn':    this.stats.counts.warning++; break;
            case 'info':    this.stats.counts.info++; break;
            case 'debug':   this.stats.counts.debug++; break;
            case 'profile': this.stats.counts.profile++; break;
        }
    }

    //#endregion

    //#region LOAD BALANCER
    private static async processBatch(batchSize: number,delay: number): Promise<void> {

        // single the queue is working and we should receive another batch
        // this should be handled by the interval, but a safety check to avoid
        // breaking FIFO.
        if(this.lbQueueLocked===true)
            return;

        // make sure we don't grab more entries than we have
        const entriesToGrab: number = (batchSize > this.lbQueue.length) ? this.lbQueue.length : batchSize;
        if(entriesToGrab===0)
            return;

        // grab entries from the start of the array to process
        this.lbQueueLocked = true;
        const entries: LogEntry[] = this.lbQueue.splice(0,entriesToGrab);

        // cycle through entries processing each with an optional delay to spread things out
        let startTime: number = 0;
        let ellapsedTime: number = 0;
        for(const entry of entries) {
            // send the log statement to Watson and wait since we want to control
            // the flow of logs to watson and ensure a FIFO process
            startTime = new Date().getTime();
            this.updateStats(entry);
            this.logger.log(entry);

            // if we want to spread out the requests, do so
            if(delay>0) {
                ellapsedTime = new Date().getTime() - startTime;

                // if the ellapsed time is less than delay
                let waitTime: number = delay;
                if(ellapsedTime<delay)
                    waitTime = delay - ellapsedTime; // wait the remainder of what we would have waited
                else if(ellapsedTime>delay) {
                    console.log(`\t log took longer (${ellapsedTime}) than delay (${delay})`);
                    continue; // already took too long. just keep moving
                } else
                    this.delay(waitTime);
            }
        }

        this.lbQueueLocked = false;
    }
    public static startLoadBalancer(): void {
        const { targetRate, burstRate, burstThreshold } = this.lbConfig;
        let interval: number;
        let batchSize: number;
        let currentRate: number;

        // utility function for recalculating how fast we should be sending logs
        const adjustIntervalAndBatchSize = () => {
            // Determine if we're in burst mode or normal mode
            if (this.lbQueue.length > burstThreshold) {
                currentRate = burstRate;  // Burst mode
            } else {
                currentRate = targetRate;  // Normal mode
            }

            // Calculate initial batch size and interval
            batchSize = Math.ceil(currentRate / 10);  // Base batch size calculation
            interval = Math.floor(1000 / (currentRate / batchSize));  // Base interval calculation

            // Adjust the interval to respect the minimum interval
            if (interval < this.lbConfig.minInterval) {
                interval = this.lbConfig.minInterval;

                // Recalculate batch size to maintain the desired currentRate while ensuring interval >= 100ms
                batchSize = Math.ceil(currentRate / (1000 / interval));
            }

            console.log(`\t Interval update (mode: ${currentRate === burstRate ? 'Burst' : 'Normal'} | batch: ${batchSize} | interval: ${interval} ms)`);
        };

        // our main loop for the load balancer
        const loadBalancerLoop = async () => {
            while (this.lbIsRunning===true) {
                if (this.lbQueue.length === 0) {
                    console.log('Queue is empty, waiting for logs...');
                    await this.delay(1000);
                    continue;
                }

                // Adjust interval and batch size
                adjustIntervalAndBatchSize();

                // figure out if we want a delay between each log sent to lower chance of
                // overflow with larger batch sizes.
                const logDelay: number = (this.lbConfig.staggerLogs) ? (interval / batchSize) : 0;

                // process our batch
                await this.processBatch(batchSize, logDelay);

                // Wait for the next iteration
                await this.delay(interval);
            }
        };

        // Start the load balancer loop if not already running
        if(this.lbIsRunning===false) {
            this.lbIsRunning = true;
            loadBalancerLoop().catch(err => console.error(err));
        }
    }
    public static stopLoadBalancer(): void {
        this.lbIsRunning = false;
    }
    private static postLog(entry: LogEntry) {
        // if we have the load balancer running, queue it up
        // otherwise just send to the logger
        if(this.lbIsRunning===true)
            this.lbQueue.push(entry);
        else {
            this.updateStats(entry);
            this.logger.log(entry);
        }
    }
    //#endregion

    //#region LOG
    // wrappers for each level of log
    public static critical(section: LogSection, message: string, data: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): void {
        this.postLog(this.getLogEntry('crit', message, data, audit, { section, caller, idUser, idRequest }));
    }
    public static error(section: LogSection, message: string, data: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): void {
        this.postLog(this.getLogEntry('error', message, data, audit, { section, caller, idUser, idRequest }));
    }
    public static warning(section: LogSection, message: string, data: any,  caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): void {
        this.postLog(this.getLogEntry('warn', message, data, audit, { section, caller, idUser, idRequest }));
    }
    public static info(section: LogSection, message: string, data: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): void {
        this.postLog(this.getLogEntry('info', message, data, audit, { section, caller, idUser, idRequest }));
    }
    public static debug(section: LogSection, message: string, data: any, caller?: string, audit: boolean=false, idUser?: number, idRequest?: number): void {
        this.postLog(this.getLogEntry('debug', message, data, audit, { section, caller, idUser, idRequest }));
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
        this.stats.counts.profile++;
        return { success: true, message: 'created profile request' };
    }
    //#endregion
}
