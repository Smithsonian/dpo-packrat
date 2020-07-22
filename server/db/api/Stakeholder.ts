/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Stakeholder as StakeholderBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Stakeholder extends DBC.DBObject<StakeholderBase> implements StakeholderBase {
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

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { IndividualName, OrganizationName, EmailAddress, PhoneNumberMobile, PhoneNumberOffice, MailingAddress } = this;
            ({ idStakeholder: this.idStakeholder, IndividualName: this.IndividualName, OrganizationName: this.OrganizationName,
                EmailAddress: this.EmailAddress, PhoneNumberMobile: this.PhoneNumberMobile, PhoneNumberOffice: this.PhoneNumberOffice,
                MailingAddress: this.MailingAddress } =
                await DBC.DBConnection.prisma.stakeholder.create({
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
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Stakeholder.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idStakeholder, IndividualName, OrganizationName, EmailAddress, PhoneNumberMobile, PhoneNumberOffice, MailingAddress } = this;
            return await DBC.DBConnection.prisma.stakeholder.update({
                where: { idStakeholder, },
                data: {
                    IndividualName,
                    OrganizationName,
                    EmailAddress,
                    PhoneNumberMobile,
                    PhoneNumberOffice,
                    MailingAddress,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Stakeholder.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idStakeholder } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findOne({ where: { idStakeholder, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.stakeholder.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idStakeholder: number): Promise<Stakeholder | null> {
        if (!idStakeholder)
            return null;
        try {
            return DBC.CopyObject<StakeholderBase, Stakeholder>(
                await DBC.DBConnection.prisma.stakeholder.findOne({ where: { idStakeholder, }, }), Stakeholder);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Stakeholder.fetch', error);
            return null;
        }
    }
}
