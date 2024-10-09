/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

//#region TYPES & INTERFACES
export interface RateManagerResult {
    success: boolean,
    message: string,
    data?: any,
}
export interface RateManagerConfig<T> {
    targetRate?: number,        // targeted logs per second (200-2000)
    burstRate?: number,         // target rate when in burst mode and playing catchup
    burstThreshold?: number,    // when queue is bigger than this size, trigger 'burst mode'
    minInterval?: number,       // minimum duration for a batch/interval in ms. (higher values use less resources)
    onPost: ((entry: T) => Promise<RateManagerResult>),     // function to call when posting an entry
}
interface RateManagerMetrics {
    counts: {
        processed: number,
        success: number,
        failure: number
    },
    queueLength: number,    // average queue length
    rateAverage: number,
    rateMax: number,
    timeStart: Date,
    timeProcessed: Date,
}
//#endregion


export class RateManager<T> {
    private isRunning: boolean = false;
    private mode: 'standard' | 'burst' = 'standard';
    private queue: Array <{
        entry: T,
        resolve: (value: RateManagerResult) => void
    }> = [];
    private config: Required<RateManagerConfig<T>>;
    private metrics: RateManagerMetrics;

    constructor(cfg: Partial<RateManagerConfig<T>>) {
        // merge our configs with what the user provided
        // we use partial to gaurantee that the properties have values
        this.config = {
            targetRate: cfg.targetRate ?? 10,
            burstRate: cfg.burstRate ?? 50,
            burstThreshold: cfg.burstThreshold ?? 250,
            minInterval: cfg.minInterval ?? 1000,
            onPost: cfg.onPost ?? (async (entry: T) => {
                console.log('[Logger] Unconfigured onPost',entry);
                return { success: true, message: 'Unconfigured onPost', data: { ...entry } };
            }),
        };

        this.metrics = {
            counts: {
                processed: 0,
                success: 0,
                failure: 0
            },
            queueLength: 0,
            rateAverage: 0,
            rateMax: 0,
            timeStart: new Date(),
            timeProcessed: new Date()
        };

        this.mode = 'standard';
    }

    //#region PUBLIC
    public async add(entry: T): Promise<RateManagerResult> {
        return new Promise((resolve) => {
            this.queue.push({ entry, resolve });
            return this.processQueue();
        });
    }
    public setConfig(config: Partial<RateManagerConfig<T>>) {
        this.config = { ...this.config, ...config };
    }
    public getConfig(): RateManagerConfig<T> {
        return this.config;
    }
    //#endregion

    //#region UTILS
    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    private calculateAverageProcessingTime(): number {
        const elapsedTime = (Date.now() - this.metrics.timeStart.getTime()) / 1000;  // Total time in ms
        const processedEntries = this.metrics.counts.processed || 1;  // Avoid divide by zero
        return (elapsedTime / processedEntries);  // Average time per entry in ms
    }
    //#endregion

    //#region QUEUE
    private updateRate(queueLength: number): void {
        this.metrics.queueLength = queueLength;
        if (queueLength > this.config.burstThreshold && this.mode === 'standard') {
            this.switchToBurstMode();
        } else if (queueLength <= this.config.burstThreshold && this.mode === 'burst') {
            this.switchToNormalMode();
        }
    }
    private switchToBurstMode(): void {
        this.mode = 'burst';
        console.warn('Switched to burst mode');
    }
    private switchToNormalMode(): void {
        this.mode = 'standard';
        console.warn('Switched to normal mode');
    }

    private async processQueue(): Promise<RateManagerResult> {
        if(this.isRunning===true)
            return { success: true, message: ' already running' };

        let lastResult: RateManagerResult = { success: true, message: 'Queue processed successfully' };

        this.isRunning = true;
        while (this.queue.length > 0 && this.isRunning) {
            this.updateRate(this.queue.length);

            if (this.mode === 'burst')
                lastResult = await this.processAtBurstRate();
            else
                lastResult = await this.processAtTargetRate();

            // add our delay as calculated, if success
            if(lastResult.data)
                await this.delay(lastResult.data.delayForRate);

            // store our metrics
            this.updateMetrics();
        }

        // Return the result of the last processed item or batch
        this.isRunning = false;
        return lastResult;
    }
    private async processAtBurstRate(): Promise<RateManagerResult> {
        // Calculate dynamic batch size based on burst rate and throughput
        const idealEntriesPerSecond = this.config.burstRate;
        const processingTimePerEntry = this.calculateAverageProcessingTime();
        const maxEntriesPerBatch = Math.max(1,Math.floor(1 / processingTimePerEntry));

        const batchSize = Math.min(this.queue.length, Math.min(maxEntriesPerBatch, idealEntriesPerSecond));
        const batch = this.queue.splice(0, batchSize);  // Remove batch from queue

        // place to store our accumulated failed messages
        const failedMessages: Array<{ entry: T, reason: string }> = [];

        console.log('process: burst', { idealEntriesPerSecond, processingTimePerEntry, maxEntriesPerBatch, batchSize });
        const startTime: number = Date.now();

        // Process each entry in the batch
        await Promise.all(batch.map(async (queueItem) => {
            let attempts = 0;
            let success = false;
            let result: RateManagerResult;

            while (attempts < 3 && !success) {
                attempts++;
                result = await this.config.onPost(queueItem.entry);

                if (result.success) {
                    // Resolve the promise as successful
                    queueItem.resolve(result);
                    success = true;
                } else if (attempts < 3) {
                    // Delay before retrying (small delay between retries)
                    await this.delay(500);  // Adjust delay as needed (500ms here)
                } else {
                    // Max retries reached, resolve as failed and add to failedMessages
                    queueItem.resolve(result);
                    failedMessages.push({ entry: queueItem.entry, reason: result.message });
                }
            }
        }));

        // update our metrics
        const processedCount = batchSize - failedMessages.length;
        this.metrics.counts.processed += processedCount;
        this.metrics.counts.success += processedCount;
        this.metrics.counts.failure += failedMessages.length;

        // figure out our actual rate based on how much time has elapsed
        // we do this to ensure we don't exceed our burst rate even if the
        // the system processes things faster than expected
        const processingTime = (Date.now() - startTime) / 1000;
        const actualRate = batchSize / processingTime;

        // Calculate the delay required to maintain the burst rate
        const targetTimeForBatch = batchSize / this.config.burstRate;  // Time we expect the batch to take
        const delayForRate = Math.max(0, (targetTimeForBatch - processingTime) * 1000);
        // console.log('process: burst', { actualRate, delayForRate });

        // if we had an failed then we return these results
        if (failedMessages.length > 0)
            return { success: false, message: 'One or more entries failed after retries', data: failedMessages };

        return { success: true, message: `Batch processed successfully: ${batchSize} entries`, data: { processingTime, actualRate, delayForRate } };
    }
    private async processAtTargetRate(): Promise<RateManagerResult> {
        // bump an entry off the list
        const entry = this.queue.shift();
        if (!entry)
            return { success: false, message: 'No entry found to process' };

        // post/process our entry and resolve its promise when done
        const startTime: number = Date.now();
        const result = await this.config.onPost(entry.entry);
        entry.resolve(result);

        // update our metrics
        this.metrics.counts.processed++;
        if (result.success)
            this.metrics.counts.success++;
        else
            this.metrics.counts.failure++;

        // figure out how long things took
        // calculate delay to maintain the target rate
        const processingTime = (Date.now() - startTime);
        const actualRate = 1 / processingTime;
        const delayForRate = 1000 / this.config.targetRate;

        return { success: true, message: 'processed entry', data: { processingTime, actualRate, delayForRate } };
    }
    //#endregion

    //#region METRICS
    private updateMetrics(): void {
        const currentTime: Date = new Date();
        const elapsedTime = (currentTime.getTime() - this.metrics.timeStart.getTime()) / 1000;  // Convert ms to seconds

        const currentRate = this.metrics.counts.processed / elapsedTime;

        this.metrics.rateAverage = (this.metrics.rateAverage * (this.metrics.counts.processed - 1) + currentRate) / this.metrics.counts.processed;

        if (currentRate > this.metrics.rateMax)
            this.metrics.rateMax = currentRate;

        this.metrics.timeProcessed = currentTime;
    }
    public getMetrics(): RateManagerMetrics {
        return this.metrics;
    }
    //#endregion
}
/*
export class RateManager<T> {
    private isRunning: boolean = false;
    private queue: Array <{
        entry: T,
        resolve: (value: RateManagerResult) => void
        // reject: (reason: RateManagerResult) => void
    }> = [];
    private isQueueLocked: boolean = false;
    private debugMode: boolean = false;
    private config: RateManagerConfig<T> = {
        targetRate: 200,
        burstRate: 1000,
        burstThreshold: 3000,
        staggerLogs: true,
        minInterval: 100,
        onPost: async (entry: T) => {
            console.log('[Logger] Unconfigured onPost',entry);
            return { success: true, message: 'Unconfigured onPost', data: { ...entry } };
        }
    };

    constructor(cfg: RateManagerConfig<T>) {
        this.config = {
            targetRate: cfg.targetRate ?? this.config.targetRate,
            burstRate: cfg.burstRate ?? this.config.burstRate,
            burstThreshold: cfg.burstThreshold ?? this.config.burstThreshold,
            staggerLogs: cfg.staggerLogs ?? this.config.staggerLogs,
            minInterval: cfg.minInterval ?? this.config.minInterval,
            onPost: cfg.onPost ?? this.config.onPost,
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
        const entries = this.queue.splice(0,entriesToGrab);

        // cycle through entries processing each with an optional delay to spread things out
        let startTime: number = 0;
        let ellapsedTime: number = 0;
        for(const entry of entries) {
            // send the log statement to Watson and wait since we want to control
            // the flow of logs to watson and ensure a FIFO process
            startTime = new Date().getTime();
            if(this.config.onPost)
                entry.resolve(await this.config.onPost(entry.entry));

            // if we want to spread out the requests, do so
            if(delay>0) {
                ellapsedTime = new Date().getTime() - startTime;

                // if the ellapsed time is less than delay
                let waitTime: number = delay;
                if(ellapsedTime<delay)
                    waitTime = delay - ellapsedTime; // wait the remainder of what we would have waited
                else if(ellapsedTime>delay) {
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
            // TODO: send through to logger system/output
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
    public add(entry: T): Promise<RateManagerResult> {
        return new Promise((resolve) => {
            this.queue.push({ entry, resolve });
            // return { success: true, message: 'added to queue' };

            // TODO: start process queue...
        });
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
    */