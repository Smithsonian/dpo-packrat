export enum NotifyType {
    UNDEFINED       = -1,
    SYSTEM_ERROR    = 1,
    SYSTEM_NOTICE   = 2,
    JOB_FAILED      = 10,
    JOB_PASSED      = 11,
    JOB_STARTED     = 12,
    SECURITY_NOTICE = 20,
}
export enum NotifyUserGroup {
    SLACK_ADMIN     = 'slack-admin',
    SLACK_ALL       = 'slack-all',
    SLACK_USER      = 'slack-user',
    EMAIL_ADMIN     = 'email-admin',
    EMAIL_USER      = 'email-user',
    EMAIL_ALL       = 'email-all',
}
export interface NotifyResult {
    success: boolean,
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any
}
export interface NotifyPackage {
    type: NotifyType,                               // what type of message is this
    message: string,                                // main message for the user
    startDate: Date,                                // when did this job/event happen or start
    endDate?: Date,                                 // when did this job/event end (optional)
    detailsLink?: { url: string, label: string },   // is there somewhere the user can get more info
    detailsMessage?: string,                        // error message, scene name, full message, etc.
    sendTo?: string[],                              // where are we sending the message. for Slack it is a user slack ID. for email it is the 'to' email address
}

export const getMessageIconUrlByType = (type: NotifyType, system: 'email' | 'slack'): string => {
    // build our filename based on the type
    const host: string = 'https://egofarms.com/packrat';
    const typeStr: string = NotifyType[type];
    const filename: string = `${host}/icon_${system}_${typeStr.toLowerCase()}.png`;
    return filename;
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
export const getMessageCategoryByType = (type: NotifyType): string => {
    switch(type) {
        case NotifyType.SYSTEM_ERROR:
        case NotifyType.SYSTEM_NOTICE: return 'System';

        case NotifyType.JOB_FAILED:
        case NotifyType.JOB_PASSED:
        case NotifyType.JOB_STARTED: return 'Job';

        case NotifyType.SECURITY_NOTICE: return 'Security';

        default: return 'N/A';
    }
};
export const getTypeString = (type: NotifyType): string => {
    const typeString: string = NotifyType[type];
    return typeString
        .toLowerCase()                           // Convert the string to lowercase
        .replace(/_/g, ' ')                      // Replace underscores with spaces
        .replace(/\b\w/g, char => char.toUpperCase());  // Capitalize the first letter of each word
};
