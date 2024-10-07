export { NotifyChannel, NotifyType, NotifyPackage } from './notifyShared';

// Email
import { NotifyEmail } from './notifyEmail';

export const sendEmailMessage = NotifyEmail.sendMessage;
export const sendEmailMessageRaw = NotifyEmail.sendMessageRaw;

// slack
