/* eslint-disable camelcase */
import { User as UserBase } from '@prisma/client';
// import * as DBC from '../connection';
import { DBConnection, DBObject, CopyArray, CopyObject } from '../connection';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

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
            return this.logError('create', error);
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
            return this.logError('update', error);
        }
    }

    static async fetch(idUser: number): Promise<User | null> {
        if (!idUser)
            return null;
        try {
            return CopyObject<UserBase, User>(
                await DBConnection.prisma.user.findUnique({ where: { idUser, }, }), User);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.User.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchByEmail(EmailAddress: string): Promise<User[] | null> {
        try {
            return CopyArray<UserBase, User>(await DBConnection.prisma.user.findMany({ where: { EmailAddress, }, }), User);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.User.fetchByEmail', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchByIDs(idUsers: number[]): Promise<User[] | null> {
        if (idUsers.length == 0)
            return null;

        try {
            return CopyArray<UserBase, User>(await DBConnection.prisma.user.findMany({ where: { idUser: { in: idUsers, }, }, }), User);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.User.fetchByIDs', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.User.fetchUserList', LOG.LS.eDB, error);
            return null;
        }
    }
}
