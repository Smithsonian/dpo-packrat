import { Strategy } from 'passport';
import PassportLocal from 'passport-local';
import * as DBAPI from '../../db';

const options = {
    usernameField: 'email'
};

const verifyFunction = async (email: string, password: string, done) => {
    const user = await DBAPI.User.fetchByEmail(email);

    if (!user) {
        throw new Error('User does not exists');
    }

    if (!user.Active) {
        throw new Error('User is not active');
    }
    // TODO: This check would be removed moving forward
    if (password !== user.EmailAddress) {
        throw new Error('Invalid password for user');
    }

    done(null, user);
};

const LocalStrategy: Strategy = new PassportLocal.Strategy(options, verifyFunction);

export default LocalStrategy;
