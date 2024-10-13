/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Config } from '../config';
import { ASL, LocalStore } from '../utils/localStore';
import { Logger as LOG, LogSection } from './logger/log';
import { Notify as NOTIFY, NotifyUserGroup, NotifyType, NotifyPackage, SlackChannel } from './notify/notify';

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

// cache for individual group IDs and emails
type GroupConfig = {
    emailAdmin:    string[],
    emailAll:      string[],
    slackAdmin:    string[] | undefined,
    slackAll:      string[] | undefined,
};

export class RecordKeeper {

    static LogSection = LogSection;
    static NotifyGroup = NotifyUserGroup;
    static NotifyType = NotifyType;

    private static defaultEmail: string[] = ['packrat@si.edu'];
    private static notifyGroupConfig: GroupConfig = {
        emailAdmin: [],
        emailAll: [],
        slackAdmin: undefined,
        slackAll: undefined,
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
        // configure email
        const emailResults = NOTIFY.configureEmail(environment);
        if(emailResults.success===false)
            return emailResults;
        this.logInfo(LogSection.eSYS, emailResults.message, { environment }, 'Recordkeeper');

        // get our email addresses from the system. these can be cached because they will be
        // the same for all users and sessions.
        this.notifyGroupConfig.emailAdmin = await this.getEmailsFromGroup(NotifyUserGroup.EMAIL_ADMIN) ?? this.defaultEmail;
        this.notifyGroupConfig.emailAll = await this.getEmailsFromGroup(NotifyUserGroup.EMAIL_ALL) ?? this.defaultEmail;

        // configure slack
        const slackResults = NOTIFY.configureSlack(environment,Config.slack.apiKey);
        if(slackResults.success===false)
            return slackResults;
        this.logInfo(LogSection.eSYS, slackResults.message, { environment }, 'Recordkeeper');

        // get our slack addresses from the system. they are cached as they will be the same
        // for all users and sessions.
        this.notifyGroupConfig.slackAdmin = await this.getSlackIDsFromGroup(NotifyUserGroup.SLACK_ADMIN);
        this.notifyGroupConfig.slackAll = await this.getSlackIDsFromGroup(NotifyUserGroup.SLACK_ALL);
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
    private static async getEmailsFromGroup(group: NotifyUserGroup, forceUpdate: boolean = false): Promise<string[] | undefined> {

        switch(group) {

            case NotifyUserGroup.EMAIL_ALL: {
                // see if we already initialized this
                if(this.notifyGroupConfig.emailAll.length>0 && forceUpdate===true)
                    return this.notifyGroupConfig.emailAll;

                // otherwise, grab all active Users from DB and their emails
                return ['eric@egofarms.com'];
            }

            case NotifyUserGroup.EMAIL_ADMIN: {
                // see if we already initialized this
                if(this.notifyGroupConfig.emailAdmin.length>0 && forceUpdate===true)
                    return this.notifyGroupConfig.emailAdmin;

                // get ids from Config and then get their emails
                return ['maslowskiec@si.edu','emaslowski@quotient-inc.com'];
            }

            case NotifyUserGroup.EMAIL_USER: {
                // const { idUser } = this.getContext();
                // TODO: from current user id
                return ['ericmaslowski@gmail.com'];
            }
        }

        return undefined;
    }
    static async sendEmail(type: NotifyType, group: NotifyUserGroup, subject: string, body: string, startDate?: Date, endDate?: Date, link?: { url: string, label: string }): Promise<IOResults> {

        // build our package
        const params: NotifyPackage = {
            type,
            message: subject,
            detailsMessage: body,
            startDate: startDate ?? new Date(),
            endDate,
            detailsLink: link,
            sendTo: await this.getEmailsFromGroup(group)
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

    /**
     * - work out user experience with RK so it makes sense
     * - test message sending and group cleanup
     * - update icons
     */

    // slack
    private static async getSlackIDsFromGroup(group: NotifyUserGroup, forceUpdate: boolean = false): Promise<string[] | undefined> {
        switch(group) {

            case NotifyUserGroup.SLACK_ALL: {
                // see if we already initialized this
                if(this.notifyGroupConfig.slackAll && this.notifyGroupConfig.slackAll.length>0 && forceUpdate===true)
                    return this.notifyGroupConfig.slackAll;

                // otherwise, grab all active Users from DB and their emails
                return ['everyone'];
            }

            case NotifyUserGroup.SLACK_ADMIN: {
                // see if we already initialized this
                if(this.notifyGroupConfig.slackAdmin && this.notifyGroupConfig.slackAdmin.length>0 && forceUpdate===true)
                    return this.notifyGroupConfig.slackAdmin;

                // get ids from Config and then get their emails
                return ['ericmaslowski'];
            }

            case NotifyUserGroup.SLACK_USER: {
                // const { idUser } = this.getContext();
                // TODO: from current user id
                return ['undefined'];
            }
        }

        return undefined;
    }
    static async sendSlack(type: NotifyType, group: NotifyUserGroup, subject: string, body: string, startDate?: Date, endDate?: Date, link?: { url: string, label: string }): Promise<IOResults> {
        // build our package
        const params: NotifyPackage = {
            type,
            message: subject,
            detailsMessage: body,
            startDate: startDate ?? new Date(),
            endDate,
            detailsLink: link,
            sendTo: await RecordKeeper.getSlackIDsFromGroup(group)
        };

        // send our message out.
        // we await the result so we can catch the failure.
        RecordKeeper.logDebug(LogSection.eSYS,'sending slack message',{ sendTo: params.sendTo },'RecordKeeper.sendSlack',false);
        const slackResult = await NOTIFY.sendSlackMessage(params, SlackChannel.PACKRAT_OPS);
        if(slackResult.success===false)
            RecordKeeper.logError(LogSection.eSYS,'failed to send slack message',{ sendTo: params.sendTo },'RecordKeeper.sendSlack',false);

        // return the results
        return slackResult;
    }
    private static async cleanSlackChannel(channel?: SlackChannel): Promise<IOResults> {
        return await NOTIFY.cleanSlackChannel(channel);
    }
    static async slackTest(numMessages: number): Promise<IOResults> {
        await RecordKeeper.cleanSlackChannel(SlackChannel.PACKRAT_OPS);

        await RecordKeeper.sendSlack(NotifyType.JOB_STARTED,NotifyUserGroup.SLACK_ADMIN,'Started ingestion: Awesome Model','Awesome model is on its way to being ingested to the system. you will be notified when it finishes', new Date());
        await RecordKeeper.sendSlack(NotifyType.JOB_PASSED,NotifyUserGroup.SLACK_ADMIN,'Awesome Model finished ingestion!','There were no issues ingesting the model and a Voyager scene was created. It is not safe, secure, and ready for QC', new Date(), undefined, { url: 'https://packrat.si.edu', label: 'Goto Scene' });
        await RecordKeeper.sendSlack(NotifyType.JOB_FAILED,NotifyUserGroup.SLACK_ADMIN,'Ingestion failed for Awesome Model','The model submitted is lacking normals and could not have a Voyager scene generated. Update the model and re-generate the scene', new Date(), undefined, { url: 'https://packrat.si.edu', label: 'Goto Model' });
        await RecordKeeper.sendSlack(NotifyType.SECURITY_NOTICE,NotifyUserGroup.SLACK_ADMIN,'Unauthorized access attempt','user (5) tried to access files from another Unit.', new Date());
        await RecordKeeper.sendSlack(NotifyType.SYSTEM_NOTICE,NotifyUserGroup.SLACK_ADMIN,'Packrat will be offline this weekend','To run some standard maintenance, Packrat will be offline this weekend. Any jobs running will be stopped.', new Date());
        await RecordKeeper.sendSlack(NotifyType.SYSTEM_ERROR,NotifyUserGroup.SLACK_ADMIN,'Packrat disk usage is at 10%!','Packrat has only 10% of disk space available for jobs.', new Date());

        return { success: true, message: `${numMessages} messages sent` };
    }
    //#endregion
}
