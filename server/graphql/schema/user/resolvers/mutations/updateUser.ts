import { CreateUserResult, MutationUpdateUserArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';
import { destroyUserSessions } from '../../../../../auth';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';
import { withAuditTransaction } from '../../../../../audit/withAuditTransaction';

export default async function updateUser(_: Parent, args: MutationUpdateUserArgs): Promise<CreateUserResult> {
    const ctx = Authorization.getContext();
    if (!ctx || !ctx.isAdmin)
        throw new Error(AUTH_ERROR.ADMIN_REQUIRED);

    const { input } = args;
    const { idUser, Name, EmailAddress, Active, EmailSettings, WorkflowNotificationTime, SlackID } = input;

    const result = await withAuditTransaction(async () => {
        const User = await DBAPI.User.fetch(idUser);
        if (User === null)
            throw new Error('User not found');

        const wasActive: boolean = User.Active;

        User.Name = Name;
        User.EmailAddress = EmailAddress;
        User.Active = Active;
        User.EmailSettings = EmailSettings ?? null;
        User.WorkflowNotificationTime = WorkflowNotificationTime;
        User.SlackID = SlackID;

        const success = await User.update();
        if (!success)
            throw new Error('Error when updating user in updateUser.ts');

        // When deactivating a user, clean up their authorization assignments
        // inside the same tx so the DB and audit rows commit atomically.
        if (wasActive && !Active) {
            const authRows: DBAPI.UserAuthorization[] | null = await DBAPI.UserAuthorization.fetchFromUser(idUser);
            if (authRows) {
                let removed = 0;
                for (const ua of authRows) {
                    await ua.delete();
                    removed++;
                }
                if (removed > 0)
                    RK.logInfo(RK.LogSection.eGQL, 'updateUser', `deactivated user ${idUser}: removed ${removed} authorization assignment(s)`, {}, 'GQL.updateUser');
            }
        }

        return { User, deactivated: wasActive && !Active };
    });

    // Session destruction touches session storage rather than the DB. Run
    // post-commit so a tx rollback does not leave sessions invalidated for
    // a user whose deactivation never persisted.
    if (result.deactivated)
        await destroyUserSessions([idUser]);

    return { User: result.User };
}
