import { CreateUserResult, MutationUpdateUserArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function updateUser(_: Parent, args: MutationUpdateUserArgs): Promise<CreateUserResult> {
    const { input } = args;
    const { idUser, Name, EmailAddress, Active, EmailSettings, WorkflowNotificationTime } = input;


    const User = await DBAPI.User.fetch(idUser);

    if (!User) {
        console.log('User not found');
        throw new Error('User not found');
    }

    User.Name = Name;
    User.EmailAddress = EmailAddress;
    User.Active = Active;
    User.EmailSettings = EmailSettings;
    User.WorkflowNotificationTime = WorkflowNotificationTime;

    await User.update();
    // User.updateWorker(userArgs);
    return { User };
}
