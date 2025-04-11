/* eslint-disable @typescript-eslint/no-explicit-any */
import { ENVIRONMENT_TYPE } from '../../config';
import { NotifyResult, NotifyPackage, NotifyUserGroup, NotifyType, randomNotifyPackage } from './notifyShared';
import { NotifyEmail } from './notifyEmail';
import { NotifySlack, SlackChannel } from './notifySlack';
import { Logger as LOG, LogSection } from '../logger/log';

export class Notify {
    // wrapper class for email and slack notifications to unify types and methods

    //#region EMAIL
    public static configureEmail(env: ENVIRONMENT_TYPE, targetRate?: number, burstRate?: number, burstThreshold?: number): NotifyResult {
        return NotifyEmail.configure(env,targetRate,burstRate,burstThreshold);
    }

    // cast the returns to NotifyResult so it's consistent with what is exported
    public static sendEmailMessage = NotifyEmail.sendMessage as (params: NotifyPackage) => Promise<NotifyResult>;
    public static sendEmailMessageRaw = NotifyEmail.sendMessageRaw as (type: NotifyType, sendTo: string[], subject: string, textBody: string, htmlBody?: string) => Promise<NotifyResult>;

    // testing emails
    public static async testEmail(numEmails: number): Promise<NotifyResult> {

        const rateManager = NotifyEmail.getRateManager();
        const hasRateManager: boolean = rateManager ? true : false;
        const config = rateManager?.getConfig();

        // create our profiler
        // we use a random string in case another test or profile is run to avoid collisisons
        const profileKey: string = `EmailTest_${Math.random().toString(36).substring(2, 6)}`;
        await LOG.profile(profileKey, LogSection.eSYS, `Email test: ${new Date().toLocaleString()}`, {
            numEmails,
            rateManager: hasRateManager,
            ...(hasRateManager === true && config && {
                config: (({ onPost: _onPost, ...rest }) => rest)(config)  // Exclude onPost
            })
        },'Notify.testEmails');

        // test our slack
        const errors: string[] = [];
        const promises: Promise<NotifyResult>[] = [];

        for(let i=0; i<numEmails; ++i) {
            const emailPackage: NotifyPackage = randomNotifyPackage(i, 'email');
            LOG.debug(LogSection.eSYS, 'sending email attempt', undefined, { type: NotifyType[emailPackage.type], sendTo: emailPackage.sendTo?.join(',') }, 'Notify.testEmail');

            const promise = NotifyEmail.sendMessage(emailPackage)
                .then((status) => {
                    if (!status.success) {
                        LOG.error(LogSection.eSYS, 'sending email failed', status.message, status.data, 'Notify.testEmail');
                        errors.push(`${i}: ${status.message} - ${status.data?.error || 'unknown error'}`);
                    }
                    return status;
                });

            promises.push(promise);
        }
        await Promise.allSettled(promises);

        // close our profiler and return results
        const metrics = rateManager?.getMetrics();
        const result = await LOG.profileEnd(profileKey);
        return { success: (errors.length<=0), message: `finished testing ${numEmails} email messages.`, data: { message: result.message, maxRate: metrics?.rates.max, avgRate: metrics?.rates.average, errors: (errors.length>0) ? errors?.join(' | ') : null } };
    }
    //#endregion

    //#region SLACK
    public static configureSlack(env: ENVIRONMENT_TYPE, apiKey: string, targetRate?: number, burstRate?: number, burstThreshold?: number): NotifyResult {
        return NotifySlack.configure(env,apiKey,targetRate,burstRate,burstThreshold);
    }

    // cast the returns to NotifyResult so it's consistent with what is exported
    // NOTE: not exporting raw variant currently due to the specialized knowledge of blocks required for it to work
    public static sendSlackMessage = NotifySlack.sendMessage as (params: NotifyPackage, channel?: SlackChannel) => Promise<NotifyResult>;
    public static clearSlackChannel = NotifySlack.clearChannel as (channel?: SlackChannel) => Promise<NotifyResult>;

    // testing slack messages
    public static async testSlack(numMessages: number, channel?: SlackChannel): Promise<NotifyResult> {

        const rateManager = NotifySlack.getRateManager();
        const hasRateManager: boolean = rateManager ? true : false;
        const config = rateManager?.getConfig();

        // create our profiler
        // we use a random string in case another test or profile is run to avoid collisisons
        const profileKey: string = `SlackTest_${Math.random().toString(36).substring(2, 6)}`;
        await LOG.profile(profileKey, LogSection.eSYS, `Slack test: ${new Date().toLocaleString()}`, {
            numMessages,
            rateManager: hasRateManager,
            ...(hasRateManager === true && config && {
                config: (({ onPost: _onPost, ...rest }) => rest)(config)  // Exclude onPost
            })
        },'Notify.testSlack');

        // test our slack
        const errors: string[] = [];
        const promises: Promise<NotifyResult>[] = [];

        for(let i=0; i<numMessages; ++i) {
            const slackPackage: NotifyPackage = randomNotifyPackage(i, 'slack');
            LOG.debug(LogSection.eSYS, 'sending slack attempt', undefined, { channel, type: NotifyType[slackPackage.type], sendTo: slackPackage.sendTo?.join(',') }, 'Notify.testSlack');

            const promise = NotifySlack.sendMessage(slackPackage, channel)
                .then((status) => {
                    if (!status.success) {
                        LOG.error(LogSection.eSYS, 'sending slack failed', status.message, status.data, 'Notify.testSlack');
                        errors.push(`${i}: ${status.message} - ${status.data?.error || 'unknown error'}`);
                    }
                    return status;
                });

            promises.push(promise);
        }
        await Promise.allSettled(promises);

        // close our profiler and return results
        const metrics = rateManager?.getMetrics();
        const result = await LOG.profileEnd(profileKey);
        return { success: (errors.length<=0), message: `finished testing ${numMessages} slack messages.`, data: { message: result.message, maxRate: metrics?.rates.max, avgRate: metrics?.rates.average, errors: (errors.length>0) ? errors?.join(' | ') : null } };
    }
    //#endregion
}

// export shared types so they can be accessed via Notify
export { NotifyPackage, NotifyUserGroup, NotifyType, SlackChannel };