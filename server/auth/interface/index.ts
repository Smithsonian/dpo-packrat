import LocalAuth from './impl/local';
import LDAPAuth from './impl/ldap';
import Config, { AUTH_TYPE } from '../../config';
import { Auth, VerifiedUser } from './types';

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
}

export { AuthFactory, Auth, VerifiedUser };
