import { NotifyResult, NotifyPackage, NotifyChannel, NotifyType } from './notifyShared';
import { NotifyEmail } from './notifyEmail';

export class Notify {

    // email wrappers
    public static configureEmail(env: 'prod' | 'dev', targetRate?: number, burstRate?: number, burstThreshold?: number): NotifyResult {
        return NotifyEmail.configure(env,targetRate,burstRate,burstThreshold);
    }
    public static sendEmailMessage = NotifyEmail.sendMessage;
    public static sendEmailMessageRaw = NotifyEmail.sendMessageRaw;

    // slack
}

// export shared types so they can be accessed via Notify
export { NotifyPackage, NotifyChannel, NotifyType };