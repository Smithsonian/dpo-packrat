/* eslint-disable @typescript-eslint/no-explicit-any */
import { NotifyResult, NotifyPackage, NotifyUserGroup, NotifyType } from './notifyShared';
import { NotifyEmail } from './notifyEmail';
import { NotifySlack, SlackChannel } from './notifySlack';

export class Notify {

    //#region EMAIL
    public static configureEmail(env: 'prod' | 'dev', targetRate?: number, burstRate?: number, burstThreshold?: number): NotifyResult {
        return NotifyEmail.configure(env,targetRate,burstRate,burstThreshold);
    }

    // cast the returns to NotifyResult so it's consistent with what is exported
    public static sendEmailMessage = NotifyEmail.sendMessage as (params: NotifyPackage) => Promise<NotifyResult>;
    public static sendEmailMessageRaw = NotifyEmail.sendMessageRaw as (type: NotifyType, sendTo: string[], subject: string, textBody: string, htmlBody?: string) => Promise<NotifyResult>;

    // testing emails
    public static testEmail = NotifyEmail.testEmails as (numEmails: number) => Promise<NotifyResult>;
    //#endregion

    //#region SLACK
    public static configureSlack(env: 'prod' | 'dev', targetRate?: number, burstRate?: number, burstThreshold?: number): NotifyResult {
        return NotifySlack.configure(env,targetRate,burstRate,burstThreshold);
    }

    // cast the returns to NotifyResult so it's consistent with what is exported
    // NOTE: not exporting raw variant currently due to the specialized knowledge of blocks required for it to work
    public static sendSlackMessage = NotifySlack.sendMessage as (params: NotifyPackage, channel?: SlackChannel) => Promise<NotifyResult>;
    public static cleanSlackChannel = NotifySlack.cleanChannel as (channel?: SlackChannel) => Promise<NotifyResult>;
    //#endregion
}

// export shared types so they can be accessed via Notify
export { NotifyPackage, NotifyUserGroup, NotifyType, SlackChannel };