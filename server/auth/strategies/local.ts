import { Strategy } from 'passport';
import PassportLocal from 'passport-local';

const options = {
    usernameField: 'email'
};

const verifyFunction = (email: string, password: string, done) => {
    /**
     * TODO: Here we need to check if user exists and password matches in our DB
     */
    const user = { id: 'user-id', name: 'Packrat user', email, password };
    done(null, user);
};

const LocalStrategy: Strategy = new PassportLocal.Strategy(options, verifyFunction);

export default LocalStrategy;
