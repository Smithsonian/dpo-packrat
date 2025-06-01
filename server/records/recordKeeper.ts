/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import { Config, ENVIRONMENT_TYPE } from '../config';
import { ASL, LocalStore } from '../utils/localStore';
import { Logger as LOG, LogSection  } from './logger/log';
import { Notify as NOTIFY, NotifyUserGroup, NotifyType, NotifyPackage, SlackChannel } from './notify/notify';

// temp definition for where IOResults will be
export type IOResults = {
    success: boolean,
    message: string,
    data?: any
};
export enum SubSystem {
    LOGGER = 'logger',
    NOTIFY_EMAIL = 'notify email',
    NOTIFY_SLACK = 'notify slack'
}

// cache for individual group IDs and emails
type GroupConfig = {
    emailAdmin:    string[],
    emailAll:      string[],
    slackAdmin:    string[] | undefined,
    slackAll:      string[] | undefined,
};

export class RecordKeeper {

    static SubSystem = SubSystem;
    static LogSection = LogSection;
    static NotifyGroup = NotifyUserGroup;
    static NotifyType = NotifyType;
    static SlackChannel = SlackChannel;

    private static defaultEmail: string[] = ['packrat@si.edu'];
    private static notifyGroupConfig: GroupConfig = {
        emailAdmin: [],
        emailAll: [],
        slackAdmin: undefined,
        slackAll: undefined,
    };
    private static systemConfig: { logger: boolean, notifyEmail: boolean, notifySlack: boolean } = { logger: false, notifyEmail: false, notifySlack: false };

    static async initialize(system: SubSystem): Promise<IOResults> {

        const environment: ENVIRONMENT_TYPE = Config.environment.type;

        let targetRate: number = Config.log.targetRate;     // targeted posts per second (100-500)
        let burstRate: number = targetRate * 5;             // target rate when in burst mode and playing catchup
        let burstThreshold: number = burstRate;             // when queue is bigger than this size, trigger 'burst mode'

        //#region CONFIG:LOGGER
        if(system===SubSystem.LOGGER) {
            // get our log path from the config
            const logPath: string = path.resolve(Config.log.root ? Config.log.root : /* istanbul ignore next */ './var/logs');

            // our default Logger configuration options
            const useRateManager: boolean = true;           // do we manage our log output for greater consistency
            targetRate = Config.log.targetRate;             // 100-500/sec
            burstRate = targetRate * 2;
            burstThreshold = burstRate;

            // initialize logger sub-system
            const logResults = LOG.configure(logPath, environment, useRateManager, targetRate, burstRate, burstThreshold);
            if(logResults.success===false) {
                // RecordKeeper.logFallback(RecordKeeper.LogSection.eSYS, 'system config failed', `Logger failed: ${logResults.message}`, { environment, path: logPath, useRateManager, targetRate, burstRate, burstThreshold }, 'Recordkeeper');
                RecordKeeper.systemConfig.logger = false;
                return logResults;
            }

            RecordKeeper.systemConfig.logger = true;
            return { success: true, message: 'Logger initialized ', data: { path: logPath, useRateManager, targetRate, burstRate, burstThreshold } };
        }
        //#endregion

        //#region CONFIG:NOTIFY:EMAIL
        if(system===SubSystem.NOTIFY_EMAIL) {
            targetRate = 1;   // sending too many triggers spam filters on network, delays are acceptable
            burstRate = 5;
            burstThreshold = 10;

            // update our default email to always 'dev' since something went wrong
            RecordKeeper.defaultEmail = ['packrat-dev@si.edu'];

            RecordKeeper.logDebug(LogSection.eSYS,'system initialize','configuring email notifications',{ targetRate, burstRate, burstThreshold },'RecordKeeper');

            const emailResults = NOTIFY.configureEmail(Config.environment.type,targetRate,burstRate,burstThreshold);
            if(emailResults.success===false) {
                RecordKeeper.logInfo(RecordKeeper.LogSection.eSYS, 'system config failed', `Email notifications failed: ${emailResults.message}`, { environment, ...emailResults.data }, 'Recordkeeper');
                RecordKeeper.systemConfig.notifyEmail = false;
                return emailResults;
            }
            // RecordKeeper.logInfo(RecordKeeper.LogSection.eSYS, 'system config success', emailResults.message, { environment, ...emailResults.data }, 'Recordkeeper');

            //initialize our group emails to the default. expecting them to be set externally during system initialization
            RecordKeeper.notifyGroupConfig.emailAdmin = RecordKeeper.defaultEmail;
            RecordKeeper.notifyGroupConfig.emailAll = RecordKeeper.defaultEmail;

            RecordKeeper.systemConfig.notifyEmail = true;
            return { success: true, message: 'Email notifications configured', data: { targetRate, burstRate, burstThreshold } };
        }
        //#endregion

        //#region CONFIG:NOTIFY:SLACK
        if(system===SubSystem.NOTIFY_SLACK) {
            // Slack API limits throughput to 1 message/sec. Not using burst mode here
            targetRate = 1;

            RecordKeeper.logDebug(LogSection.eSYS,'system initialize','configuring slack notifications',{ targetRate, burstRate, burstThreshold },'RecordKeeper');

            const slackResults = NOTIFY.configureSlack(environment,Config.slack.apiKey,targetRate);
            if(slackResults.success===false) {
                RecordKeeper.logInfo(RecordKeeper.LogSection.eSYS, 'system config failed', `Slack notifications failed: ${slackResults.message}`, { environment, ...slackResults.data }, 'Recordkeeper');
                RecordKeeper.systemConfig.notifySlack = false;
                return slackResults;
            }
            // RecordKeeper.logInfo(RecordKeeper.LogSection.eSYS, 'system config success', slackResults.message, { environment, ...slackResults.data }, 'Recordkeeper');

            // get our slack addresses from the system. they are cached as they will be the same
            // for all users and sessions.
            RecordKeeper.notifyGroupConfig.slackAdmin = await RecordKeeper.getSlackIDsFromGroup(NotifyUserGroup.SLACK_ADMIN);
            RecordKeeper.notifyGroupConfig.slackAll = await RecordKeeper.getSlackIDsFromGroup(NotifyUserGroup.SLACK_ALL);

            RecordKeeper.systemConfig.notifySlack = true;
            return { success: true, message: 'Slack notifications configured', data: { targetRate, burstRate, burstThreshold } };
        }
        //#endregion

        return { success: false, message: `cannot configure system. unsupported system: ${system}` };
    }

    static cleanup(): IOResults {
        return { success: true, message: 'record keeper cleaned up' };
    }
    private static getContext(): { idUser: number, idRequest: number, userEmail: string | null } {
        // get our user and request ids from the local store
        // TEST: does it maintain store context since static and not async
        const LS: LocalStore | undefined = ASL?.getStore();
        if(!LS)
            return { idUser: -1, idRequest: -1, userEmail: null };

        // if no user, return an error id. otherwise, return what we got
        return { idUser: LS.idUser ?? -1, idRequest: LS.idRequest, userEmail: LS.userEmail };
    }

    //#region LOG
    // Log routines for specific levels
    static async logCritical(sec: LogSection, message: string, reason?: string, data?: any, caller?: string, audit: boolean = false): Promise<IOResults> {
        const { idUser, idRequest } = RecordKeeper.getContext();
        return LOG.critical(sec,message,reason,data,caller,audit,idUser,idRequest);
    }
    static async logError(sec: LogSection, message: string, reason?: string, data?: any, caller?: string, audit: boolean = false): Promise<IOResults> {
        const { idUser, idRequest } = RecordKeeper.getContext();
        return LOG.error(sec,message,reason,data,caller,audit,idUser,idRequest);
    }
    static async logWarning(sec: LogSection, message: string, reason?: string, data?: any, caller?: string, audit: boolean = false): Promise<IOResults> {
        const { idUser, idRequest } = RecordKeeper.getContext();
        return LOG.warning(sec,message,reason,data,caller,audit,idUser,idRequest);
    }
    static async logInfo(sec: LogSection, message: string, reason?: string, data?: any, caller?: string, audit: boolean = false): Promise<IOResults> {
        const { idUser, idRequest } = RecordKeeper.getContext();
        return LOG.info(sec,message,reason,data,caller,audit,idUser,idRequest);
    }
    static async logDebug(sec: LogSection, message: string, reason?: string, data?: any, caller?: string, audit: boolean = false): Promise<IOResults> {
        const { idUser, idRequest } = RecordKeeper.getContext();
        return LOG.debug(sec,message,reason,data,caller,audit,idUser,idRequest);
    }
    static async logPerformance(sec: LogSection, message: string, reason?: string, data?: any, caller?: string, audit: boolean = false): Promise<IOResults> {
        const { idUser, idRequest } = RecordKeeper.getContext();
        return LOG.performance(sec,message,reason,data,caller,audit,idUser,idRequest);
    }

    // profiler functions
    // Usage: call 'profile' with a unique label and any needed metadata. This creates/starts a timer.
    //        to stop the timer and log the result, call profileEnd with the same label used to create it.
    static async profile(label: string, sec: LogSection, message: string, data?: any, caller?: string): Promise<IOResults> {
        const { idUser, idRequest } = RecordKeeper.getContext();
        return LOG.profile(label, sec, message, data, caller, idUser, idRequest);
    }
    static async profileEnd(label: string): Promise<IOResults> {
        return LOG.profileEnd(label);
    }
    static async profileUpdate(label: string, data: any): Promise<IOResults> {
        return LOG.profileUpdate(label, data);
    }

    // stats and utilities
    static logFallback(sec: LogSection, message: string, reason: string, data?: any, caller?: string): void {
        console.log(`[FALLBACK] ${sec}: ${message}, ${reason} (caller: ${caller} | data: ${JSON.stringify(data)})`);
    }
    static logTotalCount(): number {
        return LOG.getStats().counts.total;
    }
    static async logTest(numLogs: number): Promise<IOResults> {
        return LOG.testLogs(numLogs);
    }
    static async logWaitForEmptyQueue(timeout: number = 10000): Promise<IOResults> {
        return LOG.waitForQueueToDrain(timeout);
    }
    //#endregion

    //#region NOTIFY
    static async sendMessage(type: NotifyType, group: NotifyUserGroup, subject: string, body: string, startDate?: Date, endDate?: Date, link?: { url: string, label: string }): Promise<IOResults> {
        // sends a message to both email and slack

        // send our message to email
        const emailResult = await RecordKeeper.sendEmail(type,group,subject,body,startDate,endDate,link);

        // figure out our slack channel based on message type if in production
        let slackChannel: SlackChannel = SlackChannel.PACKRAT_DEV;
        if(Config.environment.type===ENVIRONMENT_TYPE.PRODUCTION) {
            slackChannel = SlackChannel.PACKRAT_OPS;
            switch(type) {
                case NotifyType.SECURITY_NOTICE:
                case NotifyType.SYSTEM_ERROR:
                case NotifyType.UNDEFINED:
                    slackChannel = SlackChannel.PACKRAT_SYSTEM;
            }
        }

        // send our message to slack
        const slackResult = await RecordKeeper.sendSlack(type,group,subject,body,slackChannel,startDate,endDate,link);

        // determine if successful or not
        if(emailResult.success===false || slackResult.success===false) {
            const error: string = [emailResult.data?.error, slackResult.data?.error].filter(Boolean).join('| ');
            return { success: false, message: 'failed to send message', data: { error } };
        }

        return { success: true, message: 'sent message to email and slack' };
    }

    // emails
    static async setEmailsForGroup(group: NotifyUserGroup, emails: string[]): Promise<IOResults> {

        switch(group) {
            case NotifyUserGroup.EMAIL_ALL: {
                RecordKeeper.notifyGroupConfig.emailAll = (emails.length>0) ? [...emails] : RecordKeeper.defaultEmail;
            } break;

            case NotifyUserGroup.EMAIL_ADMIN: {
                RecordKeeper.notifyGroupConfig.emailAdmin = (emails.length>0) ? [...emails] : RecordKeeper.defaultEmail;
            } break;
        }

        return { success: true, message: `${emails.length} emails set for group: ${this.NotifyGroup[group]}` };
    }
    private static async getEmailsFromGroup(group: NotifyUserGroup, forceUpdate: boolean = false): Promise<string[] | undefined> {

        switch(group) {

            case NotifyUserGroup.EMAIL_ALL: {
                // see if we already initialized this
                if(RecordKeeper.notifyGroupConfig.emailAll.length>0 && forceUpdate===true)
                    return RecordKeeper.notifyGroupConfig.emailAll;
                else
                    return RecordKeeper.defaultEmail;
            }

            case NotifyUserGroup.EMAIL_ADMIN: {

                // see if we already initialized this
                if(RecordKeeper.notifyGroupConfig.emailAdmin.length>0 && forceUpdate===true)
                    return RecordKeeper.notifyGroupConfig.emailAdmin;
                else
                    return RecordKeeper.defaultEmail;
            }

            case NotifyUserGroup.EMAIL_USER: {
                const { idUser, userEmail } = RecordKeeper.getContext();

                // if no notification settings or user, nothing so email not sent
                if(!idUser || !userEmail) {
                    RecordKeeper.logError(LogSection.eSYS,'get user failed','user or email does not exist', { idUser, userEmail },'RecordKeeper.getEmailsFromGroup');
                    return RecordKeeper.defaultEmail;
                }

                return [userEmail];
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
            sendTo: await RecordKeeper.getEmailsFromGroup(group)
        };

        // our optional elements
        if(endDate) params.endDate = endDate;
        if(link) params.detailsLink = link;

        // if sendTo is empty, don't send message
        if(!params.sendTo || params.sendTo.length===0)
            return { success: false, message: 'cannot send email. no user to send to.' };

        // send our message out.
        // we await the result so we can catch and audit the failure
        RecordKeeper.logDebug(LogSection.eSYS,'sending email attempt',undefined,{ sendTo: params.sendTo },'RecordKeeper.sendEmail',true);
        const emailResult = await NOTIFY.sendEmailMessage(params);
        if(emailResult.success===false)
            RecordKeeper.logError(LogSection.eSYS,'sending email failed',emailResult.message,{ sendTo: params.sendTo },'RecordKeeper.sendEmail',true);
        RecordKeeper.logInfo(LogSection.eSYS,'sending email success',undefined,{ sendTo: params.sendTo },'RecordKeeper.sendEmail',true);

        // return the results
        return emailResult;
    }
    static async sendEmailRaw(type: NotifyType, sendTo: string[], subject: string, textBody: string, htmlBody?: string): Promise<IOResults> {

        // if sendTo is empty, don't send message
        if(!sendTo || sendTo.length===0)
            return { success: false, message: 'cannot send raw email. no user to send to.' };

        // send our email but also log it for auditing
        // we wait for results so we can log the failure
        RecordKeeper.logDebug(LogSection.eSYS,'sending email attempt',undefined,{ sendTo },'RecordKeeper.sendEmailRaw',true);
        const emailResult = await NOTIFY.sendEmailMessageRaw(type, sendTo, subject, textBody, htmlBody);
        if(emailResult.success===false)
            RecordKeeper.logError(LogSection.eSYS,'sending email failed',emailResult.message,{ sendTo },'RecordKeeper.sendEmailRaw',true);
        RecordKeeper.logInfo(LogSection.eSYS,'sending email success',undefined,{ sendTo },'RecordKeeper.sendEmailRaw',true);

        return emailResult;
    }
    static async emailTest(numEmails: number): Promise<IOResults> {
        return NOTIFY.testEmail(numEmails);
    }
    static async emailWaitForEmptyQueue(timeout: number = 10000): Promise<IOResults> {
        return NOTIFY.waitEmptyEmailQueue(timeout);
    }

    // slack
    private static async getSlackIDsFromGroup(group: NotifyUserGroup, forceUpdate: boolean = false): Promise<string[] | undefined> {
        switch(group) {

            case NotifyUserGroup.SLACK_ALL: {
                // see if we already initialized this
                if(RecordKeeper.notifyGroupConfig.slackAll && RecordKeeper.notifyGroupConfig.slackAll.length>0 && forceUpdate===true)
                    return RecordKeeper.notifyGroupConfig.slackAll;

                // otherwise, grab all active Users from DB and their emails
                return ['everyone'];
            }

            case NotifyUserGroup.SLACK_ADMIN: {
                // see if we already initialized this
                if(RecordKeeper.notifyGroupConfig.slackAdmin && RecordKeeper.notifyGroupConfig.slackAdmin.length>0 && forceUpdate===true)
                    return RecordKeeper.notifyGroupConfig.slackAdmin;

                // get ids from Config and then get their emails
                return ['ericmaslowski'];
            }

            case NotifyUserGroup.SLACK_USER: {
                // const { idUser } = RecordKeeper.getContext();
                // TODO: from current user id
                return ['undefined'];
            }
        }

        return undefined;
    }
    static async sendSlack(type: NotifyType, group: NotifyUserGroup, subject: string, body: string, channel?: SlackChannel, startDate?: Date, endDate?: Date, link?: { url: string, label: string }): Promise<IOResults> {
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
        RecordKeeper.logDebug(LogSection.eSYS,'sending slack attempt',undefined,{ sendTo: params.sendTo },'RecordKeeper.sendSlack',false);
        const slackResult = await NOTIFY.sendSlackMessage(params,channel);
        if(slackResult.success===false)
            RecordKeeper.logError(LogSection.eSYS,'sending slack failed',slackResult.message,{ error: slackResult.data.error, sendTo: params.sendTo },'RecordKeeper.sendSlack',false);
        RecordKeeper.logInfo(LogSection.eSYS,'sending slack success',undefined,{ sendTo: params.sendTo },'RecordKeeper.sendSlack',false);

        // return the results
        return slackResult;
    }
    private static async clearSlackChannel(channel?: SlackChannel): Promise<IOResults> {
        const clearResult = await NOTIFY.clearSlackChannel(channel);
        if(clearResult.success===false)
            RecordKeeper.logDebug(LogSection.eSYS, 'clear slack channel failed', clearResult.message, { error: clearResult.data.error }, 'RecordKeeper.clearSlackChannel' );
        else
            RecordKeeper.logDebug(LogSection.eSYS, 'clear slack channel success', undefined, { channel: clearResult.data.channel, count: clearResult.data.count }, 'RecordKeeper.clearSlackChannel');

        return clearResult;
    }
    static async slackTest(numMessages: number, clearChannel: boolean=true, channel?: SlackChannel): Promise<IOResults> {
        channel = channel ?? SlackChannel.PACKRAT_DEV;
        if(clearChannel)
            await RecordKeeper.clearSlackChannel(channel);

        return NOTIFY.testSlack(numMessages,channel);
    }
    static async slackWaitForEmptyQueue(timeout: number = 10000): Promise<IOResults> {
        return NOTIFY.waitEmptySlackQueue(timeout);
    }
    //#endregion

    // utility
    static convertResults(src: any, message?: string, data?: any): IOResults {
        if(!src)
            return { success: false, message: 'invalid conversion', data: src };

        const result: IOResults = { success: false, message: message ?? '', data };
        if(src.success)
            result.success = src.success;
        else
            return { success: false, message: 'invalid format conversion.', data: src };

        // if we have an error message prepend it to the data property
        if(src.error)
            result.data = { reason: src.error, ...data };

        return result;
    }
    static async drainAllQueues(timeout: number = 10000): Promise<IOResults> {

        const errors: string[] = [];

        let result = await RecordKeeper.logWaitForEmptyQueue(timeout);
        if(!result.success) errors.push(`log: ${result.message}`);

        result = await RecordKeeper.emailWaitForEmptyQueue(timeout);
        if(!result.success) errors.push(`email: ${result.message}`);

        result = await RecordKeeper.slackWaitForEmptyQueue(timeout);
        if(!result.success) errors.push(`slack: ${result.message}`);

        if(errors.length === 0)
            return { success: true, message: 'all queues drained' };
        else
            return { success: false, message: 'cannot drain all queues', data: { errors } };
    }
}
