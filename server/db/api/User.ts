/* eslint-disable camelcase */
import { User as UserBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export enum eUserStatus {
    eAll,
    eActive,
    eInactive
}

export class User extends DBC.DBObject<UserBase> implements UserBase {
    idUser!: number;
    Active!: boolean;
    DateActivated!: Date;
    DateDisabled!: Date | null;
    EmailAddress!: string;
    EmailSettings!: number | null;
    Name!: string;
    SecurityID!: string;
    WorkflowNotificationTime!: Date | null;

    private ActiveOrig!: boolean;

    constructor(input: UserBase) {
        super(input);
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
                await DBC.DBConnection.prisma.user.create({
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
            LOG.logger.error('DBAPI.User.create', error);
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

            return await DBC.DBConnection.prisma.user.update({
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
            LOG.logger.error('DBAPI.User.update', error);
            return false;
        }
    }

    static async fetch(idUser: number): Promise<User | null> {
        if (!idUser)
            return null;
        try {
            return DBC.CopyObject<UserBase, User>(
                await DBC.DBConnection.prisma.user.findOne({ where: { idUser, }, }), User);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.User.fetch', error);
            return null;
        }
    }

    static async fetchByEmail(EmailAddress: string): Promise<User[] | null> {
        try {
            return DBC.CopyArray<UserBase, User>(await DBC.DBConnection.prisma.user.findMany({ where: { EmailAddress, }, }), User);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.User.fetchByEmail', error);
            return null;
        }
    }

    static async fetchUserList(search: string, eStatus: eUserStatus): Promise<User[] | null> {
        try {
            const Active: boolean = (eStatus == eUserStatus.eActive);

            switch (eStatus) {
                case eUserStatus.eAll:
                    return DBC.CopyArray<UserBase, User>(await DBC.DBConnection.prisma.user.findMany({
                        where: {
                            OR: [
                                { EmailAddress: { contains: search }, },
                                { Name: { contains: search }, },
                            ],
                        },
                    }), User);

                default:
                    return DBC.CopyArray<UserBase, User>(await DBC.DBConnection.prisma.user.findMany({
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
            LOG.logger.error('DBAPI.User.fetchUserList', error);
            return null;
        }
    }
}
