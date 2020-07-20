import passport from 'passport';
import { LocalStrategy } from './strategies';

passport.use(LocalStrategy);

passport.serializeUser((user, done) => {
    // @ts-ignore
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    // TODO: de serialize user here
    done(null, { id });
});

export default passport;
