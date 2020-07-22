import PassportLocal from 'passport-local';
import passport from 'passport';
import { User } from '../types/graphql';
import * as DBAPI from '../db';
import { AuthFactory, Auth, VerifiedUser } from './interface';

const options = {
    usernameField: 'email'
};

const verifyFunction = async (email: string, password: string, done) => {
    const auth: Auth = AuthFactory.getInstance();
    const { user, error }: VerifiedUser = await auth.verifyUser(email, password);

    if (error) {
        done(error, null);
    } else {
        done(null, user);
    }
};

const Strategy = new PassportLocal.Strategy(options, verifyFunction);

passport.use(Strategy);

passport.serializeUser((user: User, done) => {
    if (!user) return done('Invalid user');
    done(null, user.idUser);
});

passport.deserializeUser(async (id: number, done) => {
    const user = await DBAPI.User.fetch(id);
    done(null, user);
});

export default passport;
