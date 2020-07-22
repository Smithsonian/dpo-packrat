import { Strategy } from 'passport';
import PassportLocal from 'passport-local';
import * as DBAPI from '../../db';
import { Auth, VerifiedUser } from '../interface';

class LocalAuth implements Auth {
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
