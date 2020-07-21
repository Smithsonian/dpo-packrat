import passport from 'passport';
import { LocalStrategy } from './impl';
import { User } from '../types/graphql';
import * as DBAPI from '../db';

passport.use(LocalStrategy);

passport.serializeUser((user: User, done) => {
    if (!user) return done('Invalid user');
    done(null, user.idUser);
});

passport.deserializeUser(async (id: number, done) => {
    const user = await DBAPI.User.fetch(id);
    done(null, user);
});

export default passport;
