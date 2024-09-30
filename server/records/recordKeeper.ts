/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Config } from '../config';
import { ASL, LocalStore } from '../utils/localStore';
import * as H from '../utils/helpers';
import { Logger as LOG, LogSection } from './logger/log';

/** TODO:
 * - change H.IOResults.error to message and make a requirement
 */

// utils
const convertToIOResults = ( result: { success: boolean, message: string }): H.IOResults => {
    // converts standard response from logging and notification systems into Packrat's current
    // 'results' structure, which has 'error' instead of message.
    return { success: result.success, error: result.message };
};

export class RecordKeeper {

    static LogSection = LogSection;

    static configure(): H.IOResults {

        // get our log path from the config
        const logPath: string = Config.log.root ? Config.log.root : /* istanbul ignore next */ './var/logs';

        // our default Logger configuration options
        // base it on the environment variable for our base/target rate
        const useLoadBalancer: boolean = true;              // do we manage our log output for greater consistency
        const targetRate: number = Config.log.targetRate;   // targeted logs per second (100-500)
        const burstRate: number = targetRate * 5;           // target rate when in burst mode and playing catchup
        const burstThreshold: number = burstRate * 5;       // when queue is bigger than this size, trigger 'burst mode'
        const staggerLogs: boolean = true;                  // do we spread the logs out during each interval or all at once

        // initialize logger sub-system
        const logResults = LOG.configure(logPath, 'dev', useLoadBalancer, targetRate, burstRate, burstThreshold, staggerLogs);
        if(logResults.success===false)
            return convertToIOResults(logResults);
        this.logInfo(LogSection.eSYS, logResults.message,{ path: logPath, useLoadBalancer, targetRate, burstRate, burstThreshold, staggerLogs });

        // initialize notify sub-system
        // ...

        return { success: true };
    }
    static cleanup(): H.IOResults {
        return { success: true };
    }

    private static getContext(): { idUser: number, idRequest: number } {
        // get our user and request ids from the local store
        // TEST: does it maintain store context since static and not async
        const LS: LocalStore | undefined = ASL?.getStore();
        if(!LS)
            return { idUser: -1, idRequest: -1 };

        // if no user, return an error id. otherwise, return what we got
        return { idUser: LS.idUser ?? -1, idRequest: LS.idRequest };
    }

    //#region LOG
    // Log routines for specific levels
    static logCritical(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): void {
        const { idUser, idRequest } = this.getContext();
        LOG.critical(sec,message,data,caller,audit,idUser,idRequest);
    }
    static logError(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): void {
        const { idUser, idRequest } = this.getContext();
        LOG.error(sec,message,data,caller,audit,idUser,idRequest);
    }
    static logWarning(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): void {
        const { idUser, idRequest } = this.getContext();
        LOG.warning(sec,message,data,caller,audit,idUser,idRequest);
    }
    static logInfo(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): void {
        const { idUser, idRequest } = this.getContext();
        LOG.info(sec,message,data,caller,audit,idUser,idRequest);
    }
    static logDebug(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): void {
        const { idUser, idRequest } = this.getContext();
        LOG.debug(sec,message,data,caller,audit,idUser,idRequest);
    }

    // profiler functions
    // Usage: call 'profile' with a unique label and any needed metadata. This creates/starts a timer.
    //        to stop the timer and log the result, call profileEnd with the same label used to create it.
    static profile(label: string, sec: LogSection, message: string, data?: any, caller?: string): H.IOResults {
        const { idUser, idRequest } = this.getContext();
        return LOG.profile(label, sec, message, data, caller, idUser, idRequest);
    }
    static profileEnd(label: string): H.IOResults {
        return LOG.profileEnd(label);
    }

    // stats and utilities
    static logTotalCount(): number {
        return LOG.getStats().counts.total;
    }
    static async logTest(numLogs: number): Promise<H.IOResults > {
        const result = await LOG.testLogs(numLogs);
        return convertToIOResults(result);
    }
    //#endregion
}
