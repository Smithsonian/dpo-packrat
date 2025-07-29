import * as DBAPI from '../../db';
import * as UTIL from '../../tests/db/api';

export class MigrationUtils {
    private static migrationUserEmail: string = 'tysonj@si.edu';

    static async fetchMigrationUser(): Promise<DBAPI.User> {
        const users: DBAPI.User[] | null = await DBAPI.User.fetchByEmail(MigrationUtils.migrationUserEmail);
        return (users && users.length > 0)
            ? users[0]
            : await UTIL.createUserTest({ Name: 'Migration User', EmailAddress: MigrationUtils.migrationUserEmail, SecurityID: 'Migration User', Active: true, DateActivated: UTIL.nowCleansed(), DateDisabled: null, WorkflowNotificationTime: UTIL.nowCleansed(), EmailSettings: 0, idUser: 0, SlackID: '' });
    }
}
