import passport from 'passport';
import { LocalStrategy } from './strategies';
import { User } from '../types/graphql';
import * as DBAPI from '../db';

passport.use(LocalStrategy);

passport.serializeUser((user: User, done) => {
    done(null, user.idUser);
});

passport.deserializeUser(async (id: number, done) => {
    const user = await DBAPI.User.fetch(id);
    done(null, user);
});

export default passport;
