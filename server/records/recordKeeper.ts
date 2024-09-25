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

        // initialize logger sub-system
        const logResults: H.IOResults = convertToIOResults(LOG.configure(logPath, 'dev'));
        if(logResults.success===false)
            return logResults;

        // initialize notify sub-system
        // ...

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
    //#endregion
}
