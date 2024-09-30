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
    },
    metrics: {
        logRate: number,    // current logs per second
        logRateAvg: number, // rolling average of log rate
        logRateMax: number, // the maximum log rate achieved
    }
}
type validLevels = 'crit' | 'error' | 'warn' | 'info' | 'debug' | 'perf';
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
    level: validLevels;
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
    private static stats: LoggerStats = {
        counts: { profile: 0, critical: 0, error: 0, warning: 0, info: 0, debug: 0, total: 0 },
        metrics: { logRate: 0, logRateAvg: 0, logRateMax: 0 }
    };
    private static debugMode: boolean = false;
    private static metricsIsRunning: boolean = false;
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

            // start up our metrics tracker (sampel every 5 seconds, 10 samples per avgerage calc)
            this.trackLogMetrics(5000,10);
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
    public static setDebugMode(value: boolean): void {
        this.debugMode = value;
    }

    //#region UTILS
    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // build our log entry structure/object
    private static getLogEntry(level: validLevels, message: string, data: any, audit: boolean, context: { section: LogSection, caller?: string, idUser?: number, idRequest?: number }): LogEntry {
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

    // update our stats counter
    private static updateStats(entry: LogEntry): void {
        // we do this here so we can track when it actually gets posted if done by the load balancer
        switch(entry.level) {
            case 'crit':    this.stats.counts.critical++; break;
            case 'error':   this.stats.counts.error++; break;
            case 'warn':    this.stats.counts.warning++; break;
            case 'info':    this.stats.counts.info++; break;
            case 'debug':   this.stats.counts.debug++; break;
            case 'perf':    this.stats.counts.profile++; break;
        }
        this.stats.counts.total++;
    }
    private static async trackLogMetrics(interval: number, avgSamples: number): Promise<void> {

        // tracking currently only works with the load balancer or we would need to maintain
        // an additional queue (or take shared approach) for tracking logs moving through
        if(this.metricsIsRunning===true || this.lbIsRunning===false)
            return;
        this.metricsIsRunning = true;

        // make sure our interval and samples are valid
        interval = Math.max(interval, 1000);
        avgSamples = Math.max(avgSamples,5);

        const logRates: number[] = [];          // Store log rates to calculate rolling average
        // const rollingAverageWindow: number = 5; // how many samples in the rolling average
        const elapsedSeconds: number = interval/1000;

        const lastSample = {
            timestamp: new Date(),
            startSize: this.stats.counts.total
        };

        while(this.metricsIsRunning && this.lbIsRunning) {
            const currentSize: number = this.stats.counts.total;

            // Ensure no divide-by-zero and that log count is greater than last sample
            if (currentSize - lastSample.startSize > 0) {
                const newLogRate: number = (currentSize - lastSample.startSize) / elapsedSeconds;

                // see if we have a new maximum and assign the log rate
                this.stats.metrics.logRateMax = Math.max(this.stats.metrics.logRate,newLogRate);
                this.stats.metrics.logRate = newLogRate;

                // Track the log rate to calculate rolling average
                logRates.push(this.stats.metrics.logRate);

                // Maintain rolling average window size
                if(logRates.length > avgSamples) {
                    logRates.shift();  // Remove the oldest rate to keep the window size constant
                }

                // Calculate rolling average
                const totalLogRate = logRates.reduce((sum, rate) => sum + rate, 0);
                this.stats.metrics.logRateAvg = totalLogRate / logRates.length;

            } else {
                this.stats.metrics.logRate = 0;
            }


            lastSample.timestamp = new Date();
            lastSample.startSize = currentSize;

            if(this.debugMode===true)
                console.log(`\tLog metrics update: (${this.stats.metrics.logRate} log/s | avg: ${this.stats.metrics.logRateAvg})`);

            await this.delay(interval);
        }

        this.metricsIsRunning = false;
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
            await this.postLogToWinston(entry);

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

            // display interval details if in debug mode
            if(this.debugMode)
                console.log(`\t Interval update (mode: ${currentRate === burstRate ? 'Burst' : 'Normal'} | batch: ${batchSize} | interval: ${interval} ms)`);
        };

        // our main loop for the load balancer
        const loadBalancerLoop = async () => {
            while (this.lbIsRunning===true) {
                if (this.lbQueue.length === 0) {
                    if(this.debugMode)
                        console.log('\tQueue is empty, waiting for logs...');

                    await this.delay(5000);
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
    //#endregion

    //#region LOG
    private static async postLog(entry: LogEntry): Promise<void> {
        // if we have the load balancer running, queue it up
        // otherwise just send to the logger
        if(this.lbIsRunning===true)
            this.lbQueue.push(entry);
        else {
            await this.postLogToWinston(entry);
        }
    }
    private static async postLogToWinston(entry: LogEntry): Promise<void> {
        await this.logger.log(entry);
        this.updateStats(entry);
    }

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

        // log the results and cleanup
        this.postLog(profileRequest.logEntry);
        this.stats.counts.profile++;
        this.requests.delete(key);

        const message: string = `${hours}:${minutes}:${seconds}:${milliseconds}`;
        return { success: true, message };
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
            level: randomLevel as validLevels,
            audit: Math.random() < 0.5,
            context: {
                section: randomSection,
                caller: `${String(index).padStart(5,'0')} - `+randomCaller,
                environment: Math.random() < 0.5 ? 'prod' : 'dev',
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
    public static async testLogs(numLogs: number): Promise<{ success: boolean, message: string }> {
        // NOTE: given the static assignment this works best when nothing else is feeding logs
        const loadBalancer: boolean = this.lbIsRunning;
        const config: LoadBalancerConfig = this.lbConfig;

        // create our profiler
        // we use a random string in case another test or profile is run to avoid collisisons
        const profileKey: string = `LogTest_${Math.random().toString(36).substring(2, 6)}`;
        this.profile(profileKey, LogSection.eHTTP, `Log test: ${new Date().toLocaleString()}`, {
            numLogs,
            loadBalancer,
            ...(loadBalancer === true && { config })
        },'Logger.test');

        // capture the current total count so we can adjust in case other events are going on
        const startCount: number = this.stats.counts.total;
        console.log('total logs at start: ',startCount);

        // test our logging
        for(let i=0; i<numLogs; ++i)
            this.postLog(this.randomLogEntry(i));

        // cycle through waiting for use to finish posting all logs
        const timeout = Math.max(numLogs * 20,10000); //assuming max 20ms per log, and wait at least 10s
        const startTime = Date.now();
        while ((this.stats.counts.total - startCount) < numLogs) {

            if(this.debugMode)
                console.log('waiting for logs to post: ',(this.stats.counts.total - startCount) +'|'+numLogs);

            // Check if timeout has been reached
            if (Date.now() - startTime > timeout) {
                console.error('Timeout reached while waiting for logs.');
                break;
            }

            // Wait for 1 second before checking again
            await this.delay(1000);
        }

        // close our profiler and return results
        const result = this.profileEnd(profileKey);
        return { success: true, message: `finished testing ${numLogs} logs. (time: ${result.message} | maxRate: ${this.stats.metrics.logRateMax})` };
    }
    //#endregion
}
