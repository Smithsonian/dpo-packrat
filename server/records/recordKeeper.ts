/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import * as H from '../utils/helpers';
import { Logger as LOG, LogSection } from './logger/log';

export class RecordKeeper {

    static LogSection = LogSection;

    static configure(logPath: string): void {
        LOG.configure(logPath, 'dev');
    }

    private static getContext(): { idUser: number, idRequest: number } {
        // values obtained from the system
        const idUser: number = 5;
        const idRequest: number = 231;

        return { idUser, idRequest };
    }

    /**
     * TODO:
     * - wrappers for each type
     * - get environment, user id, request id from system
     * - profile support
     */
    static logInfo(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): void {
        // let msg: string = (caller) ? `[${caller}] ` : '';
        // msg += message;

        // see how we should format our data
        // if(data) {
        //     if(typeof(data)=='string')
        //         msg += ` (${data})`;
        //     else
        //         msg += ` (${H.Helpers.JSONStringify(data)})`;
        // }

        // get our user/request info
        const { idUser, idRequest } = this.getContext();

        // send to the logger
        LOG.info(sec,message,data,caller,audit,idUser,idRequest);
    }

    static logError(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): void {
        // let msg: string = (caller) ? `[${caller}] ` : '';
        // msg += message;

        // // see how we should format our data
        // if(data) {
        //     if(typeof(data)=='string')
        //         msg += ` (${data})`;
        //     else
        //         msg += ` (${H.Helpers.JSONStringify(data)})`;
        // }

        // get our user/request info
        const { idUser, idRequest } = this.getContext();

        // send to the logger
        LOG.error(sec,message,data,caller,audit,idUser,idRequest);
    }
}

// [API.generateDownloads] some message about it ({data: 'params for tracing info. can be straight string too'})