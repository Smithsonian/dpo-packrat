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
    metricsInterval?: number,   // the rate in which metrics (averages) are calculated in ms (default: 5s)
    onPost: ((entry: T) => Promise<RateManagerResult>),     // function to call when posting an entry
}
export interface RateManagerMetrics {
    counts: {
        processed: number,
        success: number,
        failure: number
    },
    rates: {
        current: number,
        average: number,
        max: number
    }
    queueLength: number,    // average queue length
    startTime: Date,
    processedTime: Date,
}
//#endregion

export class RateManager<T> {
    private isRunning: boolean = false;
    private isMetricsRunning: boolean = false;
    private debugMode: boolean = false;
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
            metricsInterval: cfg.metricsInterval ?? 1000,
            onPost: cfg.onPost ?? (async (entry: T) => {
                console.log('[RateManager] Unconfigured onPost',entry);
                return { success: true, message: 'Unconfigured onPost', data: { ...entry } };
            }),
        };

        this.metrics = {
            counts: {
                processed: 0,
                success: 0,
                failure: 0
            },
            rates: {
                current: 0,
                average: 0,
                max: 0
            },
            queueLength: 0,
            startTime: new Date(),
            processedTime: new Date()
        };

        // set our mode. the manager starts automatically when first entry is received
        this.mode = 'standard';
        this.trackRateMetrics(this.config.metricsInterval,5);
    }

    //#region PUBLIC
    public async add(entry: T): Promise<RateManagerResult> {
        // create a new promise that is resovled when it actually posts
        // call processQueue to start it
        return new Promise((resolve) => {
            this.queue.push({ entry, resolve });

            // make sure the queue is running
            if(this.isRunning===false)
                this.processQueue();
        });
    }

    public setConfig(config: Partial<RateManagerConfig<T>>) {
        this.config = { ...this.config, ...config };
    }
    public getConfig(): RateManagerConfig<T> {
        return this.config;
    }

    public startManager(): void {
        // start our queue if needed. used if manager is stopped with entries still in the queue.
        this.processQueue();

        // start our metrics tracker
        this.trackRateMetrics(this.config.metricsInterval, 5);
    }
    public stopManager(): void {
        this.isRunning = false;
        this.isMetricsRunning = false;
    }
    public cleanup(): void {
        this.stopManager();
        this.queue = [];
        this.mode = 'standard';
    }
    //#endregion

    //#region UTILS
    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    private calculateAverageProcessingTime(): number {
        const elapsedTime = (Date.now() - this.metrics.startTime.getTime()) / 1000;  // Total time in ms
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

    private async processQueue(): Promise<void> {
        if(this.isRunning===true)
            return;

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
                await this.delay(Math.max(0, lastResult.data.delayForRate));
        }

        // Return the result of the last processed item or batch
        this.isRunning = false;
    }
    private async processAtBurstRate(): Promise<RateManagerResult> {
        // Calculate dynamic batch size based on burst rate and throughput
        const idealEntriesPerSecond = this.config.burstRate;
        const processingTimePerEntry = Math.max(this.calculateAverageProcessingTime(),0.001);
        const maxEntriesPerBatch = Math.max(1,Math.floor(1 / processingTimePerEntry));

        const batchSize = Math.min(this.queue.length, Math.min(maxEntriesPerBatch, idealEntriesPerSecond));
        const batch = this.queue.splice(0, batchSize);  // Remove batch from queue

        // place to store our accumulated failed messages
        const failedMessages: Array<{ entry: T, reason: string }> = [];

        if(this.debugMode===true)
            console.log('[RateManager] process: pre batch', { idealEntriesPerSecond, processingTimePerEntry, maxEntriesPerBatch, batchSize });

        // Process each entry in the batch
        const startTime: number = Date.now();
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
                    await this.delay(500);
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

        if(this.debugMode===true)
            console.log('[RateManager] process: post batch', { actualRate, delayForRate });

        // if we had an failed then we return these results
        if (failedMessages.length > 0)
            return { success: false, message: 'One or more entries failed after retries', data: failedMessages };

        return { success: true, message: `Batch processed successfully: ${batchSize} entries`, data: { processingTime, actualRate, delayForRate } };
    }
    private async processAtTargetRate(): Promise<RateManagerResult> {
        // bump an entry off the list
        const entry = this.queue.shift();
        if (!entry)
            return { success: true, message: 'No entry found to process' };

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
        const processingTime = Date.now() - startTime;
        const actualRate = 1 / processingTime;
        const delayForRate = Math.max(0, (1000 / this.config.targetRate));

        return { success: true, message: 'processed entry', data: { processingTime, actualRate, delayForRate } };
    }
    //#endregion

    //#region METRICS
    private async trackRateMetrics(interval: number, maxSamples: number): Promise<void> {
        // updating our metrics runs in the background at some interval that makes sense for the system
        // if already running, bail
        if(this.isMetricsRunning===true)
            return;
        this.isMetricsRunning = true;

        // make sure our interval and samples are valid
        interval = Math.max(interval, 1000);
        maxSamples = Math.max(maxSamples,5);

        // fixed interval duration
        const elapsedSeconds: number = interval/1000;

        // storage of our rates
        const previousRates: number[] = [];
        const lastSample = {
            timestamp: new Date(),
            startSize: this.metrics.counts.processed
        };

        while(this.isMetricsRunning===true) {
            const currentSize: number = this.metrics.counts.processed;
            const currentDiff: number = currentSize - lastSample.startSize;

            // Ensure no divide-by-zero and that count is greater than last sample
            // if there is no difference then we ignore storing it so we don't skew
            // our average with idle time. (note: the average is for throughput vs. usage)
            if (currentSize - lastSample.startSize > 0) {
                const newLogRate: number = currentDiff / elapsedSeconds;

                // see if we have a new maximum and assign the rate
                this.metrics.rates.max = Math.max(this.metrics.rates.max,newLogRate);
                this.metrics.rates.current = newLogRate;

                // Track the rate to calculate rolling average
                previousRates.push(this.metrics.rates.current);

                // Maintain rolling average window size
                // Remove the oldest rate to keep the window size constant
                if(previousRates.length > maxSamples)
                    previousRates.shift();

                // Calculate rolling average
                const totalLogRate = previousRates.reduce((sum, rate) => sum + rate, 0);
                this.metrics.rates.average = totalLogRate / previousRates.length;
            }

            lastSample.timestamp = new Date();
            lastSample.startSize = currentSize;

            if(this.debugMode===true)
                console.log(`[RateManager] metrics update: (${currentDiff} entries | current: ${this.metrics.rates.current}/s | avg: ${this.metrics.rates.average}/s | max: ${this.metrics.rates.max}/s)`);

            await this.delay(interval);
        }

        this.isMetricsRunning = false;
    }
    public getMetrics(): RateManagerMetrics {
        return this.metrics;
    }
    //#endregion
}