import { CreateUserResult, MutationCreateUserArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createUser(_: Parent, args: MutationCreateUserArgs, context: Context): Promise<CreateUserResult> {
    const { input } = args;
    const { Name, EmailAddress, SecurityID } = input;
    const { prisma } = context;

    const userArgs = {
        idUser: 0,
        Name,
        EmailAddress,
        SecurityID,
        Active: true,
        DateActivated: new Date(),
        DateDisabled: null,
        WorkflowNotificationTime: new Date(),
        EmailSettings: 0
    };

    const User = await DBAPI.createUser(prisma, userArgs);

    return { User };
}
