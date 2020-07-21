import { Strategy } from 'passport';
import PassportLocal from 'passport-local';
import * as DBAPI from '../../db';

const options = {
    usernameField: 'email'
};

const verifyFunction = async (email: string, password: string, done) => {
    const user = await DBAPI.User.fetchByEmail(email);

    if (!user) {
        return done('User does not exist', null);
    }

    if (!user.Active) {
        return done('User is not active', null);
    }
    // TODO: password is same as email (to be removed/updated)
    if (password !== user.EmailAddress) {
        return done('Invalid password for user', null);
    }

    done(null, user);
};

const LocalStrategy: Strategy = new PassportLocal.Strategy(options, verifyFunction);

export default LocalStrategy;
