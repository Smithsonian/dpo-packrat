/* eslint-disable camelcase */
import { Stakeholder as StakeholderBase, SystemObject as SystemObjectBase, join } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Stakeholder extends DBC.DBObject<StakeholderBase> implements StakeholderBase, SystemObjectBased {
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

    static async fetchAll(): Promise<Stakeholder[] | null> {
        try {
            return DBC.CopyArray<StakeholderBase, Stakeholder>(
                await DBC.DBConnection.prisma.stakeholder.findMany(), Stakeholder);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Stakeholder.fetchAll', error);
            return null;
        }
    }

    /**
     * Computes the array of Stakeholders that are connected to any of the specified projects.
     * Stakeholders are connected to system objects; we examine those system objects which are in a *derived* relationship
     * to system objects connected to any of the specified projects.
     * @param idProjects Array of Project.idProject
     */
    static async fetchDerivedFromProjects(idProjects: number[]): Promise<Stakeholder[] | null> {
        if (!idProjects || idProjects.length == 0)
            return null;
        try {
            return DBC.CopyArray<StakeholderBase, Stakeholder>(
                await DBC.DBConnection.prisma.$queryRaw<Stakeholder[]>`
                SELECT DISTINCT S.*
                FROM Stakeholder AS S
                JOIN SystemObject AS SOS ON (S.idStakeholder = SOS.idStakeholder)
                JOIN SystemObjectXref AS SOX ON (SOS.idSystemObject = SOX.idSystemObjectDerived)
                JOIN SystemObject AS SOP ON (SOX.idSystemObjectMaster = SOP.idSystemObject)
                WHERE SOP.idProject IN (${join(idProjects)})`, Stakeholder);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Stakeholder.fetchDerivedFromProjects', error);
            return null;
        }
    }
}
