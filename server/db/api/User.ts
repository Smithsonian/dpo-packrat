/* eslint-disable camelcase */
import { User as UserBase } from '@prisma/client';
// import * as DBC from '../connection';
import { DBConnection, DBObject, CopyArray, CopyObject } from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export enum eUserStatus {
    eAll,
    eActive,
    eInactive
}

export class User extends DBObject<UserBase> implements UserBase {
    idUser!: number;
    Name!: string;
    EmailAddress!: string;
    SecurityID!: string;
    Active!: boolean;
    DateActivated!: Date;
    DateDisabled!: Date | null;
    WorkflowNotificationTime!: Date | null; // null = None | Date exists means a property other than none
    EmailSettings!: number | null;          // if above is !Null then 0 = Daily & 1 = Immediate

    private ActiveOrig!: boolean;

    constructor(input: UserBase) {
        super(input);
    }

    public fetchTableName(): string { return 'User'; }
    public fetchID(): number { return this.idUser; }

    static constructFromPrisma(userBase: UserBase): User {
        return new User({
            idUser: userBase.idUser,
            Name: userBase.Name,
            EmailAddress: userBase.EmailAddress,
            SecurityID: userBase.SecurityID,
            Active: /* istanbul ignore next */ H.Helpers.safeBoolean(userBase.Active) ?? false,
            DateActivated: userBase.DateActivated,
            DateDisabled: userBase.DateDisabled,
            WorkflowNotificationTime: userBase.WorkflowNotificationTime,
            EmailSettings: userBase.EmailSettings
        });
    }

    protected updateCachedValues(): void {
        this.ActiveOrig = this.Active;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            let { DateActivated, DateDisabled } = this;
            const { Name, EmailAddress, SecurityID, Active, WorkflowNotificationTime, EmailSettings } = this;
            DateActivated = new Date();
            DateDisabled = (!Active) ? DateActivated : null;

            ({
                idUser: this.idUser, Name: this.Name, EmailAddress: this.EmailAddress, SecurityID: this.SecurityID,
                Active: this.Active, DateActivated: this.DateActivated, DateDisabled: this.DateDisabled,
                WorkflowNotificationTime: this.WorkflowNotificationTime, EmailSettings: this.EmailSettings
            } =
                await DBConnection.prisma.user.create({
                    data: {
                        Name,
                        EmailAddress,
                        SecurityID,
                        Active,
                        DateActivated,
                        DateDisabled,
                        WorkflowNotificationTime,
                        EmailSettings
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.User');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            let { DateActivated, DateDisabled } = this;
            const { idUser, Name, EmailAddress, SecurityID, Active, WorkflowNotificationTime, EmailSettings, ActiveOrig } = this;

            // handle disabling and activating by detecting a change in the Active state:
            if (Active != ActiveOrig) {
                if (ActiveOrig) // we are disabling
                    this.DateDisabled = DateDisabled = new Date();
                else {          // we are activating
                    this.DateActivated = DateActivated = new Date();
                    this.DateDisabled = DateDisabled = null;
                }
            }

            return await DBConnection.prisma.user.update({
                where: { idUser, },
                data: {
                    Name,
                    EmailAddress,
                    SecurityID,
                    Active,
                    DateActivated,
                    DateDisabled,
                    WorkflowNotificationTime,
                    EmailSettings
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.User');
            return  false;
        }
    }

    static async fetch(idUser: number): Promise<User | null> {
        if (!idUser)
            return null;
        try {
            return CopyObject<UserBase, User>(
                await DBConnection.prisma.user.findUnique({ where: { idUser, }, }), User);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.User');
            return null;
        }
    }

    static async fetchByEmail(EmailAddress: string): Promise<User[] | null> {
        try {
            return CopyArray<UserBase, User>(await DBConnection.prisma.user.findMany({ where: { EmailAddress, }, }), User);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch by email failed',H.Helpers.getErrorString(error),{ ...this },'DB.User');
            return null;
        }
    }

    static async fetchByIDs(idUsers: number[]): Promise<User[] | null> {
        if (idUsers.length == 0)
            return null;

        try {
            return CopyArray<UserBase, User>(await DBConnection.prisma.user.findMany({ where: { idUser: { in: idUsers, }, }, }), User);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch by id failed',H.Helpers.getErrorString(error),{ ...this },'DB.User');
            return null;
        }
    }

    static async fetchUserList(search: string, eStatus: eUserStatus): Promise<User[] | null> {
        try {
            const Active: boolean = (eStatus == eUserStatus.eActive);

            switch (eStatus) {
                case eUserStatus.eAll:
                    return CopyArray<UserBase, User>(await DBConnection.prisma.user.findMany({
                        orderBy: { Name: 'asc' },
                        where: {
                            OR: [
                                { EmailAddress: { contains: search }, },
                                { Name: { contains: search }, },
                            ],
                        },
                    }), User);

                default:
                    return CopyArray<UserBase, User>(await DBConnection.prisma.user.findMany({
                        orderBy: { Name: 'asc' },
                        where: {
                            AND: [
                                {
                                    OR: [
                                        { EmailAddress: { contains: search }, },
                                        { Name: { contains: search }, },
                                    ]
                                },
                                { Active },
                            ],
                        },
                    }), User);
            }
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch user list failed',H.Helpers.getErrorString(error),{ ...this },'DB.User');
            return null;
        }
    }

    static async fetchEmailsByIDs(userIDs: number[] = [], eStatus: eUserStatus = eUserStatus.eActive): Promise<string[] | null> {

        let users: User[] | null = [];

        // if no users provided then we grab all of them
        if(!userIDs || userIDs.length==0)
            users = await User.fetchUserList('',eStatus);
        else
            users = await User.fetchByIDs(userIDs);

        // make sure we have something to return
        if(!users || users.length===0)
            return null;

        // build array of email addresses but only for those active
        const emails: string[] = users.filter(u => u.Active && u.WorkflowNotificationTime).map(u => u.EmailAddress);
        return emails;
    }


}
