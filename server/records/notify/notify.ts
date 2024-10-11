/* eslint-disable @typescript-eslint/no-explicit-any */
import { NotifyResult, NotifyPackage, NotifyChannel, NotifyType } from './notifyShared';
import { NotifyEmail } from './notifyEmail';

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
    //#endregio
}

// export shared types so they can be accessed via Notify
export { NotifyPackage, NotifyChannel, NotifyType };