import { CreateUserResult, MutationCreateUserArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';

export default async function createUser(_: Parent, args: MutationCreateUserArgs): Promise<CreateUserResult> {
    const ctx = Authorization.getContext();
    if (!ctx || !ctx.isAdmin)
        throw new Error(AUTH_ERROR.ADMIN_REQUIRED);

    const { input } = args;
    const { Name, EmailAddress, EmailSettings, SlackID } = input;

    const userArgs = {
        idUser: 0,
        Name,
        EmailAddress,
        SecurityID: '',
        Active: true,
        DateActivated: new Date(),
        DateDisabled: null,
        WorkflowNotificationTime: null,
        EmailSettings: EmailSettings ?? null,
        SlackID: SlackID ?? '',
    };

    const User = new DBAPI.User(userArgs);
    await User.create();
    return { User };
}
