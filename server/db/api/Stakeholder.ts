/* eslint-disable camelcase */
import { PrismaClient, Stakeholder, SystemObject } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createStakeholder(prisma: PrismaClient, stakeholder: Stakeholder): Promise<Stakeholder | null> {
    let createSystemObject: Stakeholder;
    const { IndividualName, OrganizationName, EmailAddress, PhoneNumberMobile, PhoneNumberOffice, MailingAddress } = stakeholder;
    try {
        createSystemObject = await prisma.stakeholder.create({
            data: {
                IndividualName,
                OrganizationName,
                EmailAddress,
                PhoneNumberMobile,
                PhoneNumberOffice,
                MailingAddress,
                SystemObject:       { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createStakeholder', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchStakeholder(prisma: PrismaClient, idStakeholder: number): Promise<Stakeholder | null> {
    try {
        return await prisma.stakeholder.findOne({ where: { idStakeholder, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchStakeholder', error);
        return null;
    }
}

export async function fetchSystemObjectForStakeholder(prisma: PrismaClient, sysObj: Stakeholder): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idStakeholder: sysObj.idStakeholder, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForStakeholder', error);
        return null;
    }
}

export async function fetchSystemObjectForStakeholderID(prisma: PrismaClient, idStakeholder: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idStakeholder, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForStakeholderID', error);
        return null;
    }
}

export async function fetchSystemObjectAndStakeholder(prisma: PrismaClient, idStakeholder: number): Promise<SystemObject & { Stakeholder: Stakeholder | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idStakeholder, }, include: { Stakeholder: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndStakeholder', error);
        return null;
    }
}

