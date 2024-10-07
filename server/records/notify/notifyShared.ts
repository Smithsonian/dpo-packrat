export enum NotifyType {
    UNDEFINED       = -1,
    SYSTEM_ERROR    = 1,
    SYSTEM_NOTICE   = 2,
    JOB_FAILED      = 10,
    JOB_PASSED      = 11,
    JOB_STARTED     = 12,
    SECURITY_NOTICE = 20,
}
export enum NotifyChannel {
    SLACK_OPS       = 'slack-ops',
    SLACK_DEV       = 'slack-dev',
    EMAIL_ADMIN     = 'email-admin',
    EMAIL_USER      = 'email-user',
    EMAIL_ALL       = 'email-all'
}
export interface NotifyResult {
    success: boolean,
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any
}
export interface NotifyPackage {
    message: string,                                // main message for the user
    startDate: Date,                                // when did this job/event happen or start
    endDate?: Date,                                 // when did this job/event end (optional)
    detailsLink?: { url: string, label: string },   // is there somewhere the user can get more info
    detailsMessage?: string,                        // error message, scene name, full message, etc.
    sendTo?: string[],                              // where are we sending the message. for Slack it is a user slack ID. for email it is the 'to' email address
}

export const getMessageIconUrlByType = (type: NotifyType): string => {

    switch(type) {
        case NotifyType.SYSTEM_ERROR:
            return 'https://egofarms.com/packrat/fire-solid.png';
        case NotifyType.SYSTEM_NOTICE:
            return 'https://egofarms.com/packrat/alarm-on.png';

        case NotifyType.JOB_FAILED:
            return 'https://egofarms.com/packrat/attack.png';
        case NotifyType.JOB_PASSED:
            return 'https://egofarms.com/packrat/award-ribbon.png';
        case NotifyType.JOB_STARTED:
            return 'https://egofarms.com/packrat/coffee.png';

        case NotifyType.SECURITY_NOTICE:
            return 'https://egofarms.com/packrat/privacy-shield-solid.png';

        default:
            return 'https://egofarms.com/packrat/gear-solid.png';
    }
};
export const getMessagePrefixByType = (type: NotifyType): string => {

    switch(type) {
        case NotifyType.SYSTEM_ERROR: return 'Error';
        case NotifyType.SYSTEM_NOTICE: return 'Notice';

        case NotifyType.JOB_FAILED: return 'Failed';
        case NotifyType.JOB_PASSED: return 'Success';
        case NotifyType.JOB_STARTED: return 'Start';

        case NotifyType.SECURITY_NOTICE: return 'Notice';

        default: return 'N/A';
    }
};
