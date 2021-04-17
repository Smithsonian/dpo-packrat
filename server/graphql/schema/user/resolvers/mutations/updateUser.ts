import { CreateUserResult, MutationUpdateUserArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
// import * as LOG from '../../../../utils/logger';

export default async function updateUser(_: Parent, args: MutationUpdateUserArgs): Promise<CreateUserResult> {
    const { input } = args;
    const { idUser, Name, EmailAddress, Active, EmailSettings, WorkflowNotificationTime } = input;


    const User = await DBAPI.User.fetch(idUser);

    if (User === null) {
        // LOG.info('Error when fetching user in updateUser.ts', LOG.LS.eGQL);
        throw new Error('User not found');
    }

    User.Name = Name;
    User.EmailAddress = EmailAddress;
    User.Active = Active;
    User.EmailSettings = EmailSettings;
    User.WorkflowNotificationTime = WorkflowNotificationTime;

    const success = await User.update();
    if (!success) {
        // LOG.info('Error when updating user in updateUser.ts', LOG.LS.eGQL);
        throw new Error('Error when updating user in updateUser.ts');
    }

    return { User };
}
