/* eslint-disable camelcase */
import { User as UserBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class User extends DBO.DBObject<UserBase> implements UserBase {
    idUser!: number;
    Active!: boolean;
    DateActivated!: Date;
    DateDisabled!: Date | null;
    EmailAddress!: string;
    EmailSettings!: number | null;
    Name!: string;
    SecurityID!: string;
    WorkflowNotificationTime!: Date | null;

    constructor(input: UserBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { Name, EmailAddress, SecurityID, Active, DateActivated, DateDisabled, WorkflowNotificationTime, EmailSettings } = this;
            ({ idUser: this.idUser, Name: this.Name, EmailAddress: this.EmailAddress, SecurityID: this.SecurityID,
                Active: this.Active, DateActivated: this.DateActivated, DateDisabled: this.DateDisabled,
                WorkflowNotificationTime: this.WorkflowNotificationTime, EmailSettings: this.EmailSettings } =
                await DBConnectionFactory.prisma.user.create({
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
        } catch (error) {
            LOG.logger.error('DBAPI.User.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idUser, Name, EmailAddress, SecurityID, Active, DateActivated, DateDisabled, WorkflowNotificationTime, EmailSettings } = this;
            return await DBConnectionFactory.prisma.user.update({
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
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.User.update', error);
            return false;
        }
    }

    static async fetch(idUser: number): Promise<User | null> {
        if (!idUser)
            return null;
        try {
            return DBO.CopyObject<UserBase, User>(
                await DBConnectionFactory.prisma.user.findOne({ where: { idUser, }, }), User);
        } catch (error) {
            LOG.logger.error('DBAPI.User.fetch', error);
            return null;
        }
    }
}
