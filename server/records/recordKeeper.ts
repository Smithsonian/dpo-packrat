/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as H from '../utils/helpers';
import * as LOG from './log/log';

export class RecordKeeper {

    static LogSection = LOG.LS;

    static logInfo(sec: LOG.LS, message: string, data?: any, caller?: string): void {
        let msg: string = (caller) ? `[${caller}] ` : '';
        msg += message;

        // see how we should format our data
        if(data) {
            if(typeof(data)=='string')
                msg += ` (${data})`;
            else
                msg += ` (${H.Helpers.JSONStringify(data)})`;
        }

        // send to the logger
        LOG.info(msg,sec);
    }

    static logError(sec: LOG.LS, message: string, data?: any, caller?: string): void {
        let msg: string = (caller) ? `[${caller}] ` : '';
        msg += message;

        // see how we should format our data
        if(data) {
            if(typeof(data)=='string')
                msg += ` (${data})`;
            else
                msg += ` (${H.Helpers.JSONStringify(data)})`;
        }

        // send to the logger
        LOG.error(msg,sec);
    }
}

// [API.generateDownloads] some message about it ({data: 'params for tracing info. can be straight string too'})