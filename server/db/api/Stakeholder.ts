/* eslint-disable camelcase */
import { Stakeholder as StakeholderBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { DBConnectionFactory, SystemObject } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class Stakeholder extends DBO.DBObject<StakeholderBase> implements StakeholderBase {
    idStakeholder!: number;
    EmailAddress!: string | null;
    IndividualName!: string;
    MailingAddress!: string | null;
    OrganizationName!: string;
    PhoneNumberMobile!: string | null;
    PhoneNumberOffice!: string | null;

    constructor(input: StakeholderBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { IndividualName, OrganizationName, EmailAddress, PhoneNumberMobile, PhoneNumberOffice, MailingAddress } = this;
            ({ idStakeholder: this.idStakeholder, IndividualName: this.IndividualName, OrganizationName: this.OrganizationName,
                EmailAddress: this.EmailAddress, PhoneNumberMobile: this.PhoneNumberMobile, PhoneNumberOffice: this.PhoneNumberOffice,
                MailingAddress: this.MailingAddress } =
                await DBConnectionFactory.prisma.stakeholder.create({
                    data: {
                        IndividualName,
                        OrganizationName,
                        EmailAddress,
                        PhoneNumberMobile,
                        PhoneNumberOffice,
                        MailingAddress,
                        SystemObject:       { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.Stakeholder.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idStakeholder, IndividualName, OrganizationName, EmailAddress, PhoneNumberMobile, PhoneNumberOffice, MailingAddress } = this;
            return await DBConnectionFactory.prisma.stakeholder.update({
                where: { idStakeholder, },
                data: {
                    IndividualName,
                    OrganizationName,
                    EmailAddress,
                    PhoneNumberMobile,
                    PhoneNumberOffice,
                    MailingAddress,
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.Stakeholder.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idStakeholder } = this;
            return DBO.CopyObject<SystemObjectBase, SystemObject>(
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idStakeholder, }, }), SystemObject);
        } catch (error) {
            LOG.logger.error('DBAPI.stakeholder.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idStakeholder: number): Promise<Stakeholder | null> {
        try {
            return DBO.CopyObject<StakeholderBase, Stakeholder>(
                await DBConnectionFactory.prisma.stakeholder.findOne({ where: { idStakeholder, }, }), Stakeholder);
        } catch (error) {
            LOG.logger.error('DBAPI.Stakeholder.fetch', error);
            return null;
        }
    }
}
