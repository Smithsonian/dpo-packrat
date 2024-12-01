/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Config, ENVIRONMENT_TYPE } from '../config';
import { ASL, LocalStore } from '../utils/localStore';
import { TestMethod } from '../utils/helpers';
import { Logger as LOG, LogSection } from './logger/log';
import { Notify as NOTIFY, NotifyUserGroup, NotifyType, NotifyPackage, SlackChannel } from './notify/notify';

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
    static SlackChannel = SlackChannel;

    private static defaultEmail: string[] = ['packrat@si.edu'];
    private static notifyGroupConfig: GroupConfig = {
        emailAdmin: [],
        emailAll: [],
        slackAdmin: undefined,
        slackAll: undefined,
    };

    static async initialize(): Promise<IOResults> {

        let targetRate: number = Config.log.targetRate;   // targeted posts per second (100-500)
        let burstRate: number = targetRate * 5;           // target rate when in burst mode and playing catchup
        let burstThreshold: number = burstRate;           // when queue is bigger than this size, trigger 'burst mode'

        //#region CONFIG:LOGGER
        // get our log path from the config
        const environment: ENVIRONMENT_TYPE = Config.environment.type;
        const logPath: string = Config.log.root ? Config.log.root : /* istanbul ignore next */ './var/logs';

        // our default Logger configuration options
        const useRateManager: boolean = true;             // do we manage our log output for greater consistency
        targetRate = Config.log.targetRate;   // 100-500/sec
        burstRate = targetRate * 2;
        burstThreshold = burstRate;

        // initialize logger sub-system
        const logResults = LOG.configure(logPath, environment, useRateManager, targetRate, burstRate, burstThreshold);
        if(logResults.success===false)
            return logResults;
        this.logInfo(LogSection.eSYS, logResults.message, { environment, path: logPath, useRateManager, targetRate, burstRate, burstThreshold }, 'Recordkeeper');
        //#endregion

        //#region CONFIG:NOTIFY:EMAIL
        targetRate = 1;   // sending too many triggers spam filters on network, delays are acceptable
        burstRate = 5;
        burstThreshold = 10;

        const emailResults = NOTIFY.configureEmail(Config.environment.type,targetRate,burstRate,burstThreshold);
        if(emailResults.success===false)
            return emailResults;
        this.logInfo(LogSection.eSYS, emailResults.message, { environment, ...emailResults.data }, 'Recordkeeper');

        // get our email addresses from the system. these can be cached because they will be
        // the same for all users and sessions.
        this.notifyGroupConfig.emailAdmin = await this.getEmailsFromGroup(NotifyUserGroup.EMAIL_ADMIN) ?? this.defaultEmail;
        this.notifyGroupConfig.emailAll = await this.getEmailsFromGroup(NotifyUserGroup.EMAIL_ALL) ?? this.defaultEmail;
        //#endregion

        //#region CONFIG:NOTIFY:SLACK
        // Slack API limits throughput to 1 message/sec. Not using burst mode here
        targetRate = 1;
        const slackResults = NOTIFY.configureSlack(environment,Config.slack.apiKey,targetRate);
        if(slackResults.success===false)
            return slackResults;
        this.logInfo(LogSection.eSYS, slackResults.message, { environment, ...slackResults.data }, 'Recordkeeper');

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
    static logCritical(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): IOResults {
        const { idUser, idRequest } = this.getContext();
        return LOG.critical(sec,message,data,caller,audit,idUser,idRequest);
    }
    static logError(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): IOResults {
        const { idUser, idRequest } = this.getContext();
        return LOG.error(sec,message,data,caller,audit,idUser,idRequest);
    }
    static logWarning(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): IOResults {
        const { idUser, idRequest } = this.getContext();
        return LOG.warning(sec,message,data,caller,audit,idUser,idRequest);
    }
    static logInfo(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): IOResults {
        const { idUser, idRequest } = this.getContext();
        return LOG.info(sec,message,data,caller,audit,idUser,idRequest);
    }
    static logDebug(sec: LogSection, message: string, data?: any, caller?: string, audit: boolean = false): IOResults {
        const { idUser, idRequest } = this.getContext();
        return LOG.debug(sec,message,data,caller,audit,idUser,idRequest);
    }

    // profiler functions
    // Usage: call 'profile' with a unique label and any needed metadata. This creates/starts a timer.
    //        to stop the timer and log the result, call profileEnd with the same label used to create it.
    static profile(label: string, sec: LogSection, message: string, data?: any, caller?: string): IOResults {
        const { idUser, idRequest } = this.getContext();
        return LOG.profile(label, sec, message, data, caller, idUser, idRequest);
    }
    static profileEnd(label: string): IOResults {
        return LOG.profileEnd(label);
    }

    // stats and utilities
    static logTotalCount(): number {
        return LOG.getStats().counts.total;
    }
    static async logTest(numLogs: number, method?: TestMethod): Promise<IOResults> {
        return LOG.testLogs(numLogs, method);
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
        this.logDebug(LogSection.eSYS,'sending email',{ sendTo: params.sendTo },'RecordKeeper.sendEmail',true);
        const emailResult = await NOTIFY.sendEmailMessage(params);
        if(emailResult.success===false)
            this.logError(LogSection.eSYS,'failed to send email',{ sendTo: params.sendTo },'RecordKeeper.sendEmail',true);

        // return the results
        return emailResult;
    }
    static async sendEmailRaw(type: NotifyType, sendTo: string[], subject: string, textBody: string, htmlBody?: string): Promise<IOResults> {

        // send our email but also log it for auditing
        // we wait for results so we can log the failure
        this.logDebug(LogSection.eSYS,'sending raw email',{ sendTo },'RecordKeeper.sendEmailRaw',true);
        const emailResult = await NOTIFY.sendEmailMessageRaw(type, sendTo, subject, textBody, htmlBody);
        if(emailResult.success===false)
            this.logError(LogSection.eSYS,'failed to send raw email',{ sendTo },'RecordKeeper.sendEmailRaw',true);

        return emailResult;
    }
    static async emailTest(numEmails: number): Promise<IOResults> {
        return NOTIFY.testEmail(numEmails);
    }

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
        RecordKeeper.logDebug(LogSection.eSYS,'sending slack message',{ sendTo: params.sendTo },'RecordKeeper.sendSlack',false);
        const slackResult = await NOTIFY.sendSlackMessage(params,channel);
        if(slackResult.success===false) {
            const data = { error: slackResult.data.error, sendTo: params.sendTo };
            if(slackResult.data.channel) { data['channel'] = slackResult.data.channel; }
            RecordKeeper.logError(LogSection.eSYS,'failed to send slack message',data,'RecordKeeper.sendSlack',false);
        }

        // return the results
        return slackResult;
    }
    private static async clearSlackChannel(channel?: SlackChannel): Promise<IOResults> {
        const clearResult = await NOTIFY.clearSlackChannel(channel);
        if(clearResult.success===false)
            RecordKeeper.logDebug(LogSection.eSYS, 'failed to clear Slack channel', { error: clearResult.data.error }, 'RecordKeeper.clearSlackChannel' );
        else
            RecordKeeper.logDebug(LogSection.eSYS, 'cleared Slack channel', { channel: clearResult.data.channel, count: clearResult.data.count }, 'RecordKeeper.clearSlackChannel');

        return clearResult;
    }
    static async slackTest(numMessages: number, clearChannel: boolean=true, channel?: SlackChannel): Promise<IOResults> {
        channel = channel ?? SlackChannel.PACKRAT_DEV;
        if(clearChannel)
            await RecordKeeper.clearSlackChannel(channel);

        return NOTIFY.testSlack(numMessages,channel);
    }
    //#endregion
}
