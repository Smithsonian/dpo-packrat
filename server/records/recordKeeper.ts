/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Config } from '../config';
import { ASL, LocalStore } from '../utils/localStore';
import { Logger as LOG, LogSection } from './logger/log';
import { Notify as NOTIFY, NotifyChannel, NotifyType, NotifyPackage } from './notify/notify';

/** TODO:
 * - change IOResults.error to message and make a requirement
 */

// utils
// const convertToIOResults = ( result: { success: boolean, message: string, data?: any }): IOResults => {
//     // converts standard response from logging and notification systems into Packrat's current
//     // 'results' structure, which has 'error' instead of message.
//     let error: string | undefined = undefined;
//     if(result.success===false && result.data) {
//         if(result.data.error)
//             error = result.data.error;
//         else
//             error = JSON.stringify(result.data);
//     }

//     const msg: string = result.message + ((error!=undefined) ? ` ${error}` : '');
//     return { success: result.success, error: msg };
// };

// temp definition for where IOResults will be
type IOResults = {
    success: boolean,
    message: string,
    data?: any
};
type ChannelConfig = {
    [NotifyChannel.SLACK_DEV]: string,
    [NotifyChannel.SLACK_OPS]: string,
    [NotifyChannel.EMAIL_ADMIN]: string[],
    [NotifyChannel.EMAIL_ALL]: string[],
};

export class RecordKeeper {

    static LogSection = LogSection;
    static NotifyChannel = NotifyChannel;
    static NotifyType = NotifyType;

    private static defaultEmail: string[] = ['packrat@si.edu'];
    private static notifyChannelConfig: ChannelConfig = {
        [NotifyChannel.EMAIL_ADMIN]: [],
        [NotifyChannel.EMAIL_ALL]: [],
        [NotifyChannel.SLACK_DEV]: 'C07MKBKGNTZ',    // packrat-dev
        [NotifyChannel.SLACK_OPS]: 'C07NCJE9FJM',    // packrat-ops
    };

    static async configure(): Promise<IOResults> {

        //#region CONFIG:LOGGER
        // get our log path from the config
        const environment: 'prod' | 'dev' = 'dev';
        const logPath: string = Config.log.root ? Config.log.root : /* istanbul ignore next */ './var/logs';

        // our default Logger configuration options
        // base it on the environment variable for our base/target rate
        const useRateManager: boolean = true;               // do we manage our log output for greater consistency
        const targetRate: number = Config.log.targetRate;   // targeted logs per second (100-500)
        const burstRate: number = targetRate * 5;           // target rate when in burst mode and playing catchup
        const burstThreshold: number = burstRate;           // when queue is bigger than this size, trigger 'burst mode'

        // initialize logger sub-system
        const logResults = LOG.configure(logPath, environment, useRateManager, targetRate, burstRate, burstThreshold);
        if(logResults.success===false)
            return logResults;
        this.logInfo(LogSection.eSYS, logResults.message, { environment, path: logPath, useRateManager, targetRate, burstRate, burstThreshold }, 'Recordkeeper');
        //#endregion

        //#region CONFIG:NOTIFY
        const notifyResults = NOTIFY.configureEmail(environment);
        if(notifyResults.success===false)
            return notifyResults;
        this.logInfo(LogSection.eSYS, notifyResults.message, { environment }, 'Recordkeeper');

        // get our email addresses from the system. these can be cached because they will be
        // the same for all users and sessions. Uses defaults of 1 email/sec.
        this.notifyChannelConfig[NotifyChannel.EMAIL_ADMIN] = await this.getEmailsFromChannel(NotifyChannel.EMAIL_ADMIN) ?? this.defaultEmail;
        this.notifyChannelConfig[NotifyChannel.EMAIL_ALL] = await this.getEmailsFromChannel(NotifyChannel.EMAIL_ALL) ?? this.defaultEmail;
        //#endregion

        return { success: true, message: 'configured record keeper' };
    }
    static cleanup(): IOResults {
        return { success: true, message: 'record keeper cleaned up' };
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
    static async logCritical(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): Promise<IOResults> {
        const { idUser, idRequest } = this.getContext();
        return LOG.critical(sec,message,data,caller,audit,idUser,idRequest);
    }
    static async logError(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): Promise<IOResults> {
        const { idUser, idRequest } = this.getContext();
        return LOG.error(sec,message,data,caller,audit,idUser,idRequest);
    }
    static async logWarning(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): Promise<IOResults> {
        const { idUser, idRequest } = this.getContext();
        return LOG.warning(sec,message,data,caller,audit,idUser,idRequest);
    }
    static async logInfo(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): Promise<IOResults> {
        const { idUser, idRequest } = this.getContext();
        return LOG.info(sec,message,data,caller,audit,idUser,idRequest);
    }
    static async logDebug(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): Promise<IOResults> {
        const { idUser, idRequest } = this.getContext();
        return LOG.debug(sec,message,data,caller,audit,idUser,idRequest);
    }

    // profiler functions
    // Usage: call 'profile' with a unique label and any needed metadata. This creates/starts a timer.
    //        to stop the timer and log the result, call profileEnd with the same label used to create it.
    static async profile(label: string, sec: LogSection, message: string, data?: any, caller?: string): Promise<IOResults> {
        const { idUser, idRequest } = this.getContext();
        return LOG.profile(label, sec, message, data, caller, idUser, idRequest);
    }
    static async profileEnd(label: string): Promise<IOResults> {
        return LOG.profileEnd(label);
    }

    // stats and utilities
    static logTotalCount(): number {
        return LOG.getStats().counts.total;
    }
    static async logTest(numLogs: number): Promise<IOResults> {
        return LOG.testLogs(numLogs);
    }
    //#endregion

    //#region NOTIFY
    // emails
    private static async getEmailsFromChannel(channel: NotifyChannel, forceUpdate: boolean = false): Promise<string[] | undefined> {

        switch(channel) {

            case NotifyChannel.EMAIL_ALL: {
                // see if we already initialized this
                if(this.notifyChannelConfig[NotifyChannel.EMAIL_ALL].length>0 && forceUpdate===true)
                    return this.notifyChannelConfig[NotifyChannel.EMAIL_ALL];

                // otherwise, grab all active Users from DB and their emails
                return ['eric@egofarms.com'];
            }

            case NotifyChannel.EMAIL_ADMIN: {
                // see if we already initialized this
                if(this.notifyChannelConfig[NotifyChannel.EMAIL_ADMIN].length>0 && forceUpdate===true)
                    return this.notifyChannelConfig[NotifyChannel.EMAIL_ADMIN];

                // get ids from Config and then get their emails
                return ['maslowskiec@si.edu','emaslowski@quotient-inc.com'];
            }

            case NotifyChannel.EMAIL_USER: {
                // const { idUser } = this.getContext();
                // TODO: from current user id
                return ['ericmaslowski@gmail.com'];
            }
        }

        return undefined;
    }
    static async sendEmail(type: NotifyType, channel: NotifyChannel, subject: string, body: string, startDate?: Date): Promise<IOResults> {

        // build our package
        const params: NotifyPackage = {
            type,
            message: subject,
            detailsMessage: body,
            startDate: startDate ?? new Date(),
            sendTo: await this.getEmailsFromChannel(channel)
        };

        // send our message out.
        // we await the result so we can catch and audit the failure
        this.logInfo(LogSection.eSYS,'sending email',{ sendTo: params.sendTo },'RecordKeeper.sendEmail',true);
        const emailResult = await NOTIFY.sendEmailMessage(params);
        if(emailResult.success===false)
            this.logError(LogSection.eSYS,'failed to send email',{ sendTo: params.sendTo },'RecordKeeper.sendEmail',true);

        // return the results
        return emailResult;
    }
    static async sendEmailRaw(type: NotifyType, sendTo: string[], subject: string, textBody: string, htmlBody?: string): Promise<IOResults> {

        // send our email but also log it for auditing
        // we wait for results so we can log the failure
        this.logInfo(LogSection.eSYS,'sending raw email',{ sendTo },'RecordKeeper.sendEmailRaw',true);
        const emailResult = await NOTIFY.sendEmailMessageRaw(type, sendTo, subject, textBody, htmlBody);
        if(emailResult.success===false)
            this.logError(LogSection.eSYS,'failed to send raw email',{ sendTo },'RecordKeeper.sendEmailRaw',true);

        return emailResult;
    }
    static async emailTest(numEmails: number): Promise<IOResults> {
        return NOTIFY.testEmail(numEmails);
    }

    // slack
    // sendSlackMessage(...)
    // sendSlackMessageRaw(...)
    //#endregion
}
