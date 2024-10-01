/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

//#region TYPES & INTERFACES
interface RateManagerResult {
    success: boolean,
    message: string,
    data?: any,
}
export interface RateManagerConfig<T> {
    targetRate?: number,     // targeted logs per second (200-2000)
    burstRate?: number,      // target rate when in burst mode and playing catchup
    burstThreshold?: number, // when queue is bigger than this size, trigger 'burst mode'
    staggerLogs?: boolean,   // do we spread logs out over each interval or submit as a single batch
    minInterval?: number,    // minimum duration for a batch/interval in ms. (higher values use less resources)
    onPost?: ((entry: T) => Promise<void>),     // function to call when posting an entry
    onMessage?: (isError: boolean, message: string, data: any) => void, // function to call when there's a message others should know about
}
//#endregion

export class RateManager<T> {
    private isRunning: boolean = false;
    private queue: T[] = [];
    private isQueueLocked: boolean = false;
    private debugMode: boolean = false;
    private config: RateManagerConfig<T> = {
        targetRate: 200,
        burstRate: 1000,
        burstThreshold: 3000,
        staggerLogs: true,
        minInterval: 100,
        onPost: async (entry: T) => { console.log('[Logger] Unconfigured onPost',entry); },
        onMessage: (isError, message, data) => { console.log('[Logger] Unconfigured onMessage',{ isError, message, data }); }
    };

    constructor(cfg: RateManagerConfig<T>) {
        this.config = {
            targetRate: cfg.targetRate ?? this.config.targetRate,
            burstRate: cfg.burstRate ?? this.config.burstRate,
            burstThreshold: cfg.burstThreshold ?? this.config.burstThreshold,
            staggerLogs: cfg.staggerLogs ?? this.config.staggerLogs,
            minInterval: cfg.minInterval ?? this.config.minInterval,
            onPost: cfg.onPost ?? this.config.onPost,
            onMessage: cfg.onMessage ?? this.config.onMessage
        };
    }
    public isActive(): boolean {
        return this.isRunning;
    }

    //#region UTILS
    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    //#endregion

    //#region QUEUE MANAGEMENT
    private async processBatch(batchSize: number,delay: number): Promise<void> {

        // single the queue is working and we should receive another batch
        // this should be handled by the interval, but a safety check to avoid
        // breaking FIFO.
        if(this.isQueueLocked===true)
            return;

        // make sure we don't grab more entries than we have
        const entriesToGrab: number = (batchSize > this.queue.length) ? this.queue.length : batchSize;
        if(entriesToGrab===0)
            return;

        // grab entries from the start of the array to process
        this.isQueueLocked = true;
        const entries: T[] = this.queue.splice(0,entriesToGrab);

        // cycle through entries processing each with an optional delay to spread things out
        let startTime: number = 0;
        let ellapsedTime: number = 0;
        for(const entry of entries) {
            // send the log statement to Watson and wait since we want to control
            // the flow of logs to watson and ensure a FIFO process
            startTime = new Date().getTime();
            if(this.config.onPost)
                await this.config.onPost(entry);

            // if we want to spread out the requests, do so
            if(delay>0) {
                ellapsedTime = new Date().getTime() - startTime;

                // if the ellapsed time is less than delay
                let waitTime: number = delay;
                if(ellapsedTime<delay)
                    waitTime = delay - ellapsedTime; // wait the remainder of what we would have waited
                else if(ellapsedTime>delay) {
                    (this.config.onMessage) && this.config.onMessage(true,'log took longer than delay',{ ellapsedTime, delay });
                    continue; // already took too long. just keep moving
                } else
                    this.delay(waitTime);
            }
        }

        this.isQueueLocked = false;
    }
    public startRateManager(): RateManagerResult {
        const { targetRate, burstRate, burstThreshold, minInterval } = this.config;
        let interval: number;
        let batchSize: number;
        let currentRate: number;

        // handle undefined
        if(!targetRate || !burstRate || !burstThreshold || !minInterval)
            return { success: false, message: 'failed to start. missing configuration', data: { targetRate, burstRate, burstThreshold, minInterval } };

        // utility function for recalculating how fast we should be sending logs
        const adjustIntervalAndBatchSize = () => {
            // Determine if we're in burst mode or normal mode
            if (this.queue.length > burstThreshold) {
                currentRate = burstRate;  // Burst mode
            } else {
                currentRate = targetRate;  // Normal mode
            }

            // Calculate initial batch size and interval
            batchSize = Math.ceil(currentRate / 10);  // Base batch size calculation
            interval = Math.floor(1000 / (currentRate / batchSize));  // Base interval calculation

            // Adjust the interval to respect the minimum interval
            if (interval < minInterval) {
                interval = minInterval;

                // Recalculate batch size to maintain the desired currentRate while ensuring interval >= 100ms
                batchSize = Math.ceil(currentRate / (1000 / interval));
            }

            // display interval details if in debug mode
            if(this.debugMode)
                console.log(`\t Interval update (mode: ${currentRate === burstRate ? 'Burst' : 'Normal'} | batch: ${batchSize} | interval: ${interval} ms)`);
        };

        // our main loop for the rate manager
        const rateManagerLoop = async () => {
            while (this.isRunning===true) {
                if (this.queue.length === 0) {
                    if(this.debugMode)
                        console.log('\tQueue is empty, waiting for logs...');

                    await this.delay(5000);
                    continue;
                }

                // Adjust interval and batch size
                adjustIntervalAndBatchSize();

                // figure out if we want a delay between each log sent to lower chance of
                // overflow with larger batch sizes.
                const logDelay: number = (this.config.staggerLogs) ? (interval / batchSize) : 0;

                // process our batch
                await this.processBatch(batchSize, logDelay);

                // Wait for the next iteration
                await this.delay(interval);
            }
        };

        // Start the rate manager loop if not already running
        if(this.isRunning===false) {
            this.isRunning = true;
            rateManagerLoop().catch(err => console.error(err));
        }

        return { success: true, message: 'started rate manager' };
    }
    public stopRateManager(): RateManagerResult {
        this.isRunning = false;
        return { success: true, message: 'stopped rate manager' };
    }
    public add(entry: T): RateManagerResult {
        this.queue.push(entry);
        return { success: true, message: 'added to queue' };
    }
    //#endregion

    //#region CONFIG
    public setConfig(cfg: RateManagerConfig<T>): RateManagerResult {
        this.config = {
            targetRate: cfg.targetRate ?? this.config.targetRate,
            burstRate: cfg.burstRate ?? this.config.burstRate,
            burstThreshold: cfg.burstThreshold ?? this.config.burstThreshold,
            staggerLogs: cfg.staggerLogs ?? this.config.staggerLogs,
            minInterval: cfg.minInterval ?? this.config.minInterval,
            onPost: cfg.onPost ?? this.config.onPost,
            onMessage: cfg.onMessage ?? this.config.onMessage
        };

        // if our rate manager is already running then we need to restart it so it gets
        // the current updated values.
        if(this.isRunning===true) {
            this.stopRateManager();
            this.startRateManager();
        }

        return { success: true, message: 'updated configuration', data: this.config };
    }
    public getConfig(): RateManagerConfig<T> {
        return this.config;
    }
    //#endregion
}