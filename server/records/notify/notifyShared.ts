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
    ADMIN           = 'admin',
    ALL             = 'all',
    USER            = 'user',
    // SLACK_ADMIN     = 'slack-admin',
    // SLACK_ALL       = 'slack-all',
    // SLACK_USER      = 'slack-user',
    // EMAIL_ADMIN     = 'email-admin',
    // EMAIL_USER      = 'email-user',
    // EMAIL_ALL       = 'email-all',
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

export const randomNotifyPackage = (index: number, system: 'email' | 'slack'): NotifyPackage => {

    const getRandomInt= (min: number, max: number): number => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // predefined options for each type
    const messages = {
        [NotifyType.SYSTEM_ERROR]: [
            'A critical system error has occurred. Immediate attention required.',
            'System failure detected in the main service pipeline.',
            'Unexpected system downtime. Engineers have been notified.',
            'Database connection failure. Systems are currently offline.',
            'Critical resource unavailable. Check service status immediately.'
        ],
        [NotifyType.SYSTEM_NOTICE]: [
            'System maintenance is scheduled for tomorrow at 3 AM.',
            'System updates will be applied this weekend. Expect downtime.',
            'Routine server checks are complete. All systems are operational.',
            'A new feature has been deployed successfully. No action required.',
            'Configuration changes have been made. Please verify system performance.'
        ],
        [NotifyType.JOB_FAILED]: [
            'The job you submitted has failed due to a processing error.',
            'Job processing could not be completed. Please check inputs.',
            'Job failure detected during data validation.',
            'Your job did not complete successfully. Logs have been updated.',
            'Unexpected failure during job execution. Please retry.'
        ],
        [NotifyType.JOB_PASSED]: [
            'Your job has successfully completed.',
            'Job execution finished without errors. Data is ready for review.',
            'Processing complete. Results have been stored and are available.',
            'The job you submitted completed successfully. No further action needed.',
            'All tasks finished without issues. You can access the output.'
        ],
        [NotifyType.JOB_STARTED]: [
            'A new job has started processing.',
            'Job execution has begun. You will be notified when it completes.',
            'Your job is now in progress.',
            'The system has started processing your job. Please wait for further updates.',
            'Processing of the submitted job has commenced.'
        ],
        [NotifyType.SECURITY_NOTICE]: [
            'A security alert has been triggered on your account.',
            'Unusual activity detected. Please verify your login credentials.',
            'Security protocols have been activated due to suspicious access.',
            'System lockdown initiated due to a security breach.',
            'Unauthorized login attempt detected. Immediate action required.'
        ]
    };
    const details = [
        { url: 'https://example.com/job-details', label: 'Job Details' },
        { url: 'https://example.com/error-log', label: 'Error Log' },
        { url: 'https://example.com/security-alert', label: 'Security Alert' },
        { url: 'https://example.com/system-status', label: 'System Status' }
    ];
    const detailsMessages = [
        'Check the logs for further details.',
        'Please contact support if you need further assistance.',
        'More information can be found in the error log.',
        'Refer to the system documentation for troubleshooting.',
        'Visit the provided link for additional details.',
        'The issue has been escalated to the dev team.',
        'System updates will follow shortly. Stay tuned.'
    ];
    const types = [
        NotifyType.SYSTEM_ERROR,
        NotifyType.SYSTEM_NOTICE,
        NotifyType.JOB_FAILED,
        NotifyType.JOB_PASSED,
        NotifyType.JOB_STARTED,
        NotifyType.SECURITY_NOTICE
    ];

    // our date range for the entry
    const notifyType = types[getRandomInt(0, types.length - 1)];
    const currentDate = new Date();
    const startDate = new Date(currentDate.getTime() - getRandomInt(1000000, 100000000)); // random past start date
    const endDate = Math.random() > 0.5 ? new Date(startDate.getTime() + getRandomInt(1000000, 100000000)) : undefined;

    // structure our return
    return {
        type: notifyType,
        message: `${index}: ${messages[notifyType][getRandomInt(0, 4)]}`,
        startDate,
        endDate,
        detailsLink: Math.random() > 0.5 ? details[getRandomInt(0, details.length - 1)] : undefined,
        detailsMessage: detailsMessages[getRandomInt(0, detailsMessages.length - 1)],
        sendTo: (system==='email') ? ['packrat-dev@si.edu'] : ['ericmaslowski']
    };
};

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
