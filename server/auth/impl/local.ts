import * as DBAPI from '../../db';
import { IAuth, VerifiedUser } from '../interface';

class LocalAuth implements IAuth {
    async verifyUser(email: string, password: string): Promise<VerifiedUser> {
        const user = await DBAPI.User.fetchByEmail(email);

        if (!user) {
            return {
                user,
                error: 'User does not exist'
            };
        }

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
