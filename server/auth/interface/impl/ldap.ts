import { Auth, VerifiedUser } from '../types';

class LDAPAuth implements Auth {
    async verifyUser(email: string, password: string): Promise<VerifiedUser> {
        // TODO: implement verify user for LDAP
        email;
        password;
        return {
            user: null,
            error: null
        };
    }
}

export default LDAPAuth;
