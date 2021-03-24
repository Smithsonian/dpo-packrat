import { IAuth, VerifyUserResult } from './IAuth';
import { LocalAuth, LDAPAuth } from '../impl';
import { Config, AUTH_TYPE } from '../../config';
import * as DBAPI from '../../db';
import * as LOG from '../../utils/logger';

export type VerifiedUser = {
    user: DBAPI.User | null;
    error: string | null;
};

class AuthFactory {
    private static instance: LocalAuth | LDAPAuth;

    static getInstance(): LocalAuth | LDAPAuth {
        if (!AuthFactory.instance) {
            if (Config.auth.type === AUTH_TYPE.LOCAL) {
                AuthFactory.instance = new LocalAuth();
            } else if (Config.auth.type === AUTH_TYPE.LDAP) {
                AuthFactory.instance = new LDAPAuth();
            }
        }
        return AuthFactory.instance;
    }

    static async verifyUser(email: string, password: string): Promise<VerifiedUser> {
        const auth: IAuth = AuthFactory.getInstance();
        const verifyRes: VerifyUserResult = await auth.verifyUser(email, password);
        if (!verifyRes.success)
            return { user: null, error: verifyRes.error };

        const users: DBAPI.User[] | null = await DBAPI.User.fetchByEmail(email);
        if (!users || users.length == 0) {
            const error: string = `${email} is not a Packrat user`;
            LOG.logger.error(`AuthFactory.verifyUser: ${error}`);
            return { user: null, error };
        }

        if (users.length > 1) {
            const error: string = `Multiple users exist for ${email}`;
            LOG.logger.error(`AuthFactory.verifyUser: ${error}`);
            return { user: null, error };
        }

        const user: DBAPI.User = users[0];
        if (!user.Active) {
            const error: string = `${email} is not active in Packrat`;
            LOG.logger.info(`AuthFactory.verifyUser: ${error}`);
            return { user: null, error };
        }

        LOG.logger.info(`AuthFactory.verifyUser ${email} successfully authenticated`);
        return { user, error: null };
    }
}

export default AuthFactory;
