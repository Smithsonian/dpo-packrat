import { Strategy } from 'passport';
import PassportLocal from 'passport-local';
import { Auth, VerifiedUser } from '../interface';

class LDAPAuth implements Auth {
    setup(): Strategy {
        const options = {
            usernameField: 'email'
        };

        const verifyFunction = async (email: string, password: string, done) => {
            const { user, error } = await this.verifyUser(email, password);

            if (error) {
                done(error, null);
            } else {
                done(null, user);
            }
        };

        const strategy = new PassportLocal.Strategy(options, verifyFunction);

        return strategy;
    }

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
