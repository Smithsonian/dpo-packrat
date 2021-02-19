import { CreateUserResult, MutationCreateUserArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createUser(_: Parent, args: MutationCreateUserArgs): Promise<CreateUserResult> {
    const { input } = args;
    const { Name, EmailAddress } = input;

    const userArgs = {
        idUser: 0,
        Name,
        EmailAddress,
        SecurityID: 'TBD',
        Active: true,
        DateActivated: new Date(),
        DateDisabled: null,
        WorkflowNotificationTime: new Date(),
        EmailSettings: 0
    };

    const User = new DBAPI.User(userArgs);
    await User.create();
    return { User };
}
