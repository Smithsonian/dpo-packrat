import * as LOG from './logger';
import  * as os from 'os';

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
        const totalTime: number = this.userTotal + this.niceTotal + this.sysTotal + this.idleTotal + this.irqTotal;
        const deltaTime: number = this.userDelta + this.niceDelta + this.sysDelta + this.idleDelta + this.irqDelta;
        return `CPU Count ${this.CPUs.length}; busy percentage ${this.emitBusyPerc()}; delta time ${deltaTime}; total time ${totalTime}`;
    }

    emitBusyPerc(): string {
        return (this.busyPerc * 100).toFixed(2) + '%';
    }
}

export class CPUMonitor {
    private monitorTimeout: number;
    private alertThreshold: number;
    private alertAlarm: number;
    private verbose: boolean;

    private alertCount: number = 0;
    private verboseCount: number = 0;
    private timer: NodeJS.Timeout | null = null;
    private OS: osStats = new osStats();

    /**
     * @monitorTimeout in milleseconds -- how often we sample CPU utilization
     * @alertThreshold busy percentage above which we'll be alerted; 100 is the maximum
     * @alertAlarm count of consequetive samples above alertThreshold that indicate an alarm status
     * @verbose true results in logging of cpu utlitization every alertAlarm samples */
    constructor(monitorTimeout: number, alertThreshold: number, alertAlarm: number, verbose?: boolean | undefined) {
        this.monitorTimeout = monitorTimeout;
        this.alertThreshold = alertThreshold;
        this.alertAlarm = alertAlarm;
        this.verbose = verbose ?? false;
    }

    start(): void {
        this.timer = setInterval(() => this.sample(), this.monitorTimeout);
    }

    stop(): void {
        if (this.timer)
            clearInterval(this.timer);
    }

    sample(): void {
        this.OS = new osStats(this.OS);
        if ((this.OS.busyPerc * 100) >= this.alertThreshold) {
            if (++this.alertCount >= this.alertAlarm)
                this.alert();
        } else
            this.alertCount = 0;

        if (this.verbose) {
            if (++this.verboseCount >= this.alertAlarm) {
                this.verboseCount = 0;
                LOG.info(`CPUMonitor.sample ${this.OS.emitInfo()}`, LOG.LS.eSYS);
            }
        }
    }

    alert(): void {
        this.alertCount = 0;
        LOG.error(`CPUMonitor exceeded ${this.alertThreshold}% CPU utilization for ${this.alertAlarm} consecutive samples: ${this.OS.emitInfo()}`, LOG.LS.eSYS);
    }
}
