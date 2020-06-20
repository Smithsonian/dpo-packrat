/* eslint-disable camelcase */
import { PrismaClient, User, UserPersonalizationSystemObject, UserPersonalizationUrl } from '@prisma/client';

export async function createUser(prisma: PrismaClient, user: User): Promise<User> {
    const { Name, EmailAddress, SecurityID, Active, DateActivated, DateDisabled, WorkflowNotificationTime, EmailSettings } = user;
    const createSystemObject: User = await prisma.user.create({
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
    });

    return createSystemObject;
}

export async function createUserPersonalizationSystemObject(prisma: PrismaClient, userPersonalizationSystemObject: UserPersonalizationSystemObject): Promise<UserPersonalizationSystemObject> {
    const { idUser, idSystemObject, Personalization } = userPersonalizationSystemObject;
    const createSystemObject: UserPersonalizationSystemObject = await prisma.userPersonalizationSystemObject.create({
        data: {
            User:           { connect: { idUser }, },
            SystemObject:   { connect: { idSystemObject }, },
            Personalization,
        },
    });

    return createSystemObject;
}

export async function createUserPersonalizationUrl(prisma: PrismaClient, userPersonalizationUrl: UserPersonalizationUrl): Promise<UserPersonalizationUrl> {
    const { idUser, URL, Personalization } = userPersonalizationUrl;
    const createSystemObject: UserPersonalizationUrl = await prisma.userPersonalizationUrl.create({
        data: {
            User:   { connect: { idUser }, },
            URL,
            Personalization,
        },
    });

    return createSystemObject;
}
