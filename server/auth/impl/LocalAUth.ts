import * as DBAPI from '../../db';
import * as LOG from '../../utils/logger';
import { IAuth, VerifiedUser } from '../interface';

class LocalAuth implements IAuth {
    async verifyUser(email: string, password: string): Promise<VerifiedUser> {
        const users: DBAPI.User[] | null = await DBAPI.User.fetchByEmail(email);

        if (!users) {
            LOG.logger.error(`LocalAuth.verifyUser could not find ${email}`);
            return {
                user: null,
                error: 'User does not exist'
            };
        }

        if (users.length > 1) {
            LOG.logger.error(`LocalAuth.verifyUser found multiple users for ${email}`);
            return {
                user: null,
                error: 'Multiple users exist for specified email address'
            };
        }

        const user: DBAPI.User = users[0];

        if (!user) {
            LOG.logger.error(`LocalAuth.verifyUser could not find ${email}`);
            return {
                user: null,
                error: 'User does not exist'
            };
        }

        if (!user.Active) {
            LOG.logger.info(`LocalAuth.verifyUser ${email} is inactive`);
            return {
                user: null,
                error: 'User is not active'
            };
        }

        // TODO: password is same as email (to be removed/updated)
        if (password !== user.EmailAddress) {
            LOG.logger.error(`LocalAuth.verifyUser invalid password for ${email}`);
            return {
                user: null,
                error: 'Invalid password for user'
            };
        }

        LOG.logger.info(`LocalAuth.verifyUser successful login for ${email}`);
        return {
            user,
            error: null
        };
    }
}

export default LocalAuth;
