import { Strategy } from 'passport';
import { LocalAuth, LDAPAuth } from './impl';
import { User } from '../types/graphql';
import Config, { AUTH_TYPE } from '../config';

type VerifiedUser = {
    user: User | null;
    error: string | null;
};

interface Auth {
    setup: () => Strategy;
    verifyUser: (email: string, password: string) => Promise<VerifiedUser>;
}

class AuthFactory {
    private static instance: LocalAuth | LDAPAuth;
    static getFactory(): LocalAuth | LDAPAuth {
        if (!AuthFactory.instance) {
            if (Config.auth.type === AUTH_TYPE.LOCAL) {
                AuthFactory.instance = new LocalAuth();
            } else if (Config.auth.type === AUTH_TYPE.LDAP) {
                AuthFactory.instance = new LDAPAuth();
            }
        }
        return AuthFactory.instance;
    }
}

export { AuthFactory as default, Auth, VerifiedUser };
