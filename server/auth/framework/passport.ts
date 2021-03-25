import PassportLocal from 'passport-local';
import passport from 'passport';
import * as DBAPI from '../../db';
import { AuthFactory, VerifiedUser } from '../interface';

const options = {
    usernameField: 'email'
};

const verifyFunction = async (email: string, password: string, done) => {
    const { user, error }: VerifiedUser = await AuthFactory.verifyUser(email, password);
    if (error) {
        done(error, null);
    } else {
        done(null, user);
    }
};

const Strategy = new PassportLocal.Strategy(options, verifyFunction);

passport.use(Strategy);

passport.serializeUser((user: DBAPI.User, done) => {
    if (!user)
        return done('Invalid user');
    done(null, user.idUser);
});

passport.deserializeUser(async (id: number, done) => {
    const user: DBAPI.User | null = await DBAPI.User.fetch(id);
    done(null, user);
});

export default passport;
