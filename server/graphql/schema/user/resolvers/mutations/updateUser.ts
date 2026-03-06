import { CreateUserResult, MutationUpdateUserArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';
import { sessionStore } from '../../../../../auth';

export default async function updateUser(_: Parent, args: MutationUpdateUserArgs): Promise<CreateUserResult> {
    const { input } = args;
    const { idUser, Name, EmailAddress, Active, EmailSettings, WorkflowNotificationTime, SlackID } = input;


    const User = await DBAPI.User.fetch(idUser);

    if (User === null) {
        // LOG.info('Error when fetching user in updateUser.ts', LOG.LS.eGQL);
        throw new Error('User not found');
    }

    const wasActive: boolean = User.Active;

    User.Name = Name;
    User.EmailAddress = EmailAddress;
    User.Active = Active;
    User.EmailSettings = EmailSettings ?? null;
    User.WorkflowNotificationTime = WorkflowNotificationTime;
    User.SlackID = SlackID;

    const success = await User.update();
    if (!success) {
        // LOG.info('Error when updating user in updateUser.ts', LOG.LS.eGQL);
        throw new Error('Error when updating user in updateUser.ts');
    }

    // When deactivating a user, clean up their authorization assignments
    // and invalidate any active sessions
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

        // Invalidate active sessions for the deactivated user
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const store = sessionStore as any;
        if (store && typeof store.all === 'function') {
            store.all((_err: unknown, sessions: Record<string, any> | null) => {
                if (!sessions) return;
                for (const [sid, sess] of Object.entries(sessions)) {
                    if (sess?.passport?.user === idUser || sess?.authContext?.idUser === idUser) {
                        store.destroy(sid, () => {
                            RK.logInfo(RK.LogSection.eGQL, 'updateUser', `destroyed session ${sid} for deactivated user ${idUser}`, {}, 'GQL.updateUser');
                        });
                    }
                }
            });
        }
    }

    return { User };
}
