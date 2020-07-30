import * as DBAPI from '../../db';
import { IAuth, VerifiedUser } from '../interface';

class LocalAuth implements IAuth {
    async verifyUser(email: string, password: string): Promise<VerifiedUser> {
        const users: DBAPI.User[] | null = await DBAPI.User.fetchByEmail(email);

        if (!users) {
            return {
                user: null,
                error: 'User does not exist'
            };
        }

        if (users.length != 1) {
            return {
                user: null,
                error: 'Multiple users exist for specified email address'
            };
        }

        const user: DBAPI.User = users[0];
        if (!user.Active) {
            return {
                user,
                error: 'User is not active'
            };
        }

        // TODO: password is same as email (to be removed/updated)
        if (password !== user.EmailAddress) {
            return {
                user,
                error: 'Invalid password for user'
            };
        }

        return {
            user,
            error: null
        };
    }
}

export default LocalAuth;
