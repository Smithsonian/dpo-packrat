import * as LOG from './logger';
import * as os from 'os';
import * as process from 'process';
// import * as H from './helpers';
// import * as heapdump from 'heapdump';
// const memwatch = require('@airbnb/node-memwatch');

/** Upon construction, computes the total MS and % CPU utilization, either compared with the pass in osStats object, or since the last reboot (if null) */
export class osStats {
    CPUs: os.CpuInfo[];

    userTotal: number = 0;
    niceTotal: number = 0;
    sysTotal: number = 0;
    idleTotal: number = 0;
    irqTotal: number = 0;

    userDelta: number = 0;
    niceDelta: number = 0;
    sysDelta: number = 0;
    idleDelta: number = 0;
    irqDelta: number = 0;

    userPerc: number = 0;
    nicePerc: number = 0;
    sysPerc: number = 0;
    idlePerc: number = 0;
    irqPerc: number = 0;

    busyPerc: number = 0;

    constructor(prev?: osStats | undefined) {
        this.CPUs = os.cpus();
        for (const cpu of this.CPUs) {
            this.userTotal += cpu.times.user;
            this.niceTotal += cpu.times.nice;
            this.sysTotal  += cpu.times.sys;
            this.idleTotal += cpu.times.idle;
            this.irqTotal  += cpu.times.irq;
        }

        // compute deltas using previous osStats object, if supplied
        if (prev) {
            this.userDelta = this.userTotal - prev.userTotal;
            this.niceDelta = this.niceTotal - prev.niceTotal;
            this.sysDelta  = this.sysTotal  - prev.sysTotal;
            this.idleDelta = this.idleTotal - prev.idleTotal;
            this.irqDelta  = this.irqTotal  - prev.irqTotal;
        } else {
            this.userDelta = this.userTotal;
            this.niceDelta = this.niceTotal;
            this.sysDelta  = this.sysTotal;
            this.idleDelta = this.idleTotal;
            this.irqDelta  = this.irqTotal;
        }

        const deltaTotal: number = this.userDelta + this.niceDelta + this.sysDelta + this.idleDelta + this.irqDelta;
        if (deltaTotal <= 0)
            return;

        this.userPerc = this.userDelta / deltaTotal;
        this.nicePerc = this.niceDelta / deltaTotal;
        this.sysPerc  = this.sysDelta  / deltaTotal;
        this.idlePerc = this.idleDelta / deltaTotal;
        this.irqPerc  = this.irqDelta  / deltaTotal;
        this.busyPerc = 1 - this.idlePerc;
    }

    emitInfo(): string {
        // const totalTime: number = this.userTotal + this.niceTotal + this.sysTotal + this.idleTotal + this.irqTotal;
        // const deltaTime: number = this.userDelta + this.niceDelta + this.sysDelta + this.idleDelta + this.irqDelta;
        // return `CPU Count ${this.CPUs.length}; busy ${this.emitBusyPerc()}; delta time ${deltaTime}; total time ${totalTime}`;
        return `CPU Count ${this.CPUs.length}; busy ${this.emitBusyPerc()}`;
    }

    emitBusyPerc(): string {
        const perc: string = (this.busyPerc * 100).toFixed(2) + '%'; // pre-pad to get fixed width number
        return ('       ' + perc).substring(perc.length);
    }
}

export class UsageMonitor {
    private monitorTimeout: number;
    private cpuAlertThreshold: number;
    private cpuAlertAlarm: number;

    private monitorMem: boolean;
    private memAlertThreshold: number;
    private memAlertAlarm: number;

    private verboseSamples: number = 0;

    private cpuAlertCount: number = 0;
    private memAlertCount: number = 0;
    private verboseCount: number = 0;
    private timer: NodeJS.Timeout | null = null;
    private OS: osStats = new osStats();

    // private heapdiff: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

    private totalMem: number = 0;
    private rssMem: number = 0;

    /**
     * @monitorTimeout in milleseconds -- how often we sample CPU utilization
     * @cpuAlertThreshold CPU busy percentage above which we'll be alerted; 100 is the maximum
     * @cpuAlertAlarm count of consequetive CPU samples above cpuAlertThreshold that indicate an alarm status
     * @monitorMem true indicates monitoring of memory usage, too
     * @memAlertThreshold mem uasge percentage above which we'll be alerted; 100 is the maximum
     * @memAlertAlarm count of consequetive MEM samples above memAlertThreshold that indicate an alarm status
     * @verboseSamples when > 0, results in logging of cpu utlitization every verboseSamples samples */
    constructor(monitorTimeout: number, cpuAlertThreshold: number, cpuAlertAlarm: number,
        monitorMem: boolean, memAlertThreshold: number, memAlertAlarm: number, verboseSamples?: number | undefined) {
        this.monitorTimeout = monitorTimeout;
        this.cpuAlertThreshold = cpuAlertThreshold;
        this.cpuAlertAlarm = cpuAlertAlarm;

        this.monitorMem = monitorMem;
        this.memAlertThreshold = memAlertThreshold;
        this.memAlertAlarm = memAlertAlarm;

        this.verboseSamples = verboseSamples ?? 0;
    }

    start(): void {
        this.totalMem = os.totalmem();
        this.timer = setInterval(() => this.sample(), this.monitorTimeout);
        if (this.monitorMem) {
            // if (!this.heapdiff)
            //     this.heapdiff = new memwatch.HeapDiff();

            /*
            memwatch.on('stats', stats => {
                LOG.info(`UsageMonitor.memwatch.stats ${H.Helpers.JSONStringify(stats)}`, LOG.LS.eSYS);

                // if (this.heapdiff) {
                //     const diff = this.heapdiff.end();
                //     LOG.info(`UsageMonitor memory GC, ${H.Helpers.JSONStringify(diff)}`, LOG.LS.eSYS);
                // }
                // this.heapdiff = new memwatch.HeapDiff();
            });
            */
        }
    }

    stop(): void {
        if (this.timer)
            clearInterval(this.timer);
    }

    sample(): void {
        let emitCPUAlert: boolean = false;
        let emitMemAlert: boolean = false;

        // CPU Monitor
        this.OS = new osStats(this.OS);
        if ((this.OS.busyPerc * 100) >= this.cpuAlertThreshold) {
            if (++this.cpuAlertCount >= this.cpuAlertAlarm)
                emitCPUAlert = true;
        } else
            this.cpuAlertCount = 0;

        // Mem Monitor
        if (this.monitorMem) {
            this.rssMem = process.memoryUsage.rss();
            if ((this.rssMem * 100 / this.totalMem) >= this.memAlertThreshold) {
                if (++this.memAlertCount === this.memAlertAlarm) {
                    emitMemAlert = true;
                    /*
                    const snapShotName: string = `./var/${Date.now()}.heapsnapshot`;
                    LOG.info(`UsageMonitor.sample emitting heap snapshot to ${snapShotName}`, LOG.LS.eSYS);
                    heapdump.writeSnapshot(snapShotName);
                    */

                    /*
                    if (this.heapdiff) {
                        const diff = this.heapdiff.end();
                        LOG.info(`UsageMonitor memory alert, ${H.Helpers.JSONStringify(diff)}`, LOG.LS.eSYS);
                        this.heapdiff = new memwatch.HeapDiff();
                    }
                    */
                }
            } else
                this.memAlertCount = 0;
        }

        if (emitCPUAlert || emitMemAlert)
            this.alert(emitCPUAlert, emitMemAlert);

        if (this.verboseSamples) {
            if (++this.verboseCount >= this.verboseSamples) {
                this.verboseCount = 0;
                LOG.info(`UsageMonitor.sample ${this.emitInfo()}`, LOG.LS.eSYS);
            }
        }
    }

    emitInfo(): string {
        let mem: string = '';
        if (this.monitorMem) {
            const memPerc: string = (this.rssMem * 100 / this.totalMem).toFixed(2) + '%';
            const memRssMB: string = (this.rssMem / 1024 / 1024).toFixed(0);
            const memTotMB: string = (this.totalMem / 1024 / 1024).toFixed(0);

            mem = `; Mem ${('       ' + memPerc).substring(memPerc.length)} ${memRssMB}/${memTotMB} MB`;
        }
        return `${this.OS.emitInfo()}${mem}`;
    }

    alert(emitCPUAlert: boolean, emitMemAlert: boolean): void {
        this.cpuAlertCount = 0;
        this.memAlertCount = 0;
        if (emitCPUAlert)
            LOG.error(`UsageMonitor exceeded ${this.cpuAlertThreshold}% CPU utilization for ${this.cpuAlertAlarm} consecutive samples: ${this.emitInfo()}`, LOG.LS.eSYS);
        if (emitMemAlert)
            LOG.error(`UsageMonitor exceeded ${this.memAlertThreshold}% Mem utilization for ${this.memAlertAlarm} consecutive samples: ${this.emitInfo()}`, LOG.LS.eSYS);
    }
}

