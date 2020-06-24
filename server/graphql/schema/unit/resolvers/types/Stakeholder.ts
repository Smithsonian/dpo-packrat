/**
 * Type resolver for Stakeholder
 */
import { fetchStakeholder } from '../../../../../db';
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Stakeholder } from '../../../../../types/graphql';

const Stakeholder = {};

export async function resolveStakeholderByID(prisma: PrismaClient, stakeholderId: number): Promise<Stakeholder | null> {
    const foundStakeholder = await fetchStakeholder(prisma, stakeholderId);

    return parseStakeholder(foundStakeholder);
}

export function parseStakeholder(foundStakeholder: DB.Stakeholder | null): Stakeholder | null {
    let stakeholder;
    if (foundStakeholder) {
        const { idStakeholder, EmailAddress, IndividualName, MailingAddress, OrganizationName, PhoneNumberMobile, PhoneNumberOffice } = foundStakeholder;
        stakeholder = {
            idStakeholder: String(idStakeholder),
            EmailAddress,
            IndividualName,
            MailingAddress,
            OrganizationName,
            PhoneNumberMobile,
            PhoneNumberOffice
        };
    }

    return stakeholder;
}

export default Stakeholder;
