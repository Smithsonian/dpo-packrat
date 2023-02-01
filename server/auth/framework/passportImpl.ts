import PassportLocal from 'passport-local';
import passport from 'passport';

import { AuthFactory, VerifiedUser } from '../interface';
import * as DBAPI from '../../db';

const options = {
    usernameField: 'email'
};

const verifyFunction = async (email: string, password: string, done) => {
    const { user, error }: VerifiedUser = await AuthFactory.verifyUser(email, password);
    if (error)
        done(error, null);
    else
        done(null, user);
};

const Strategy = new PassportLocal.Strategy(options, verifyFunction);

passport.use(Strategy);

passport.serializeUser((user: Express.User, done) => {
    if (!user)
        return done('Invalid user');
    done(null, Number(user['idUser']));
});

passport.deserializeUser(async (id: number, done) => {
    const user: DBAPI.User | null = await DBAPI.User.fetch(id);
    // At this point, our express middleware hasn't yet been called, so ASL.getStore() will return null
    // Instead of the code below, we rely on passport stashing the user object in req['user']
    // This is likely accomplished via this method here!
    // We use that stashed user when creating the local store
    /*
    if (user) {
        const LS: LocalStore | undefined = ASL.getStore();
        if (LS)
            LS.user = user;
    }
    */
    done(null, user);
});

export default passport;
