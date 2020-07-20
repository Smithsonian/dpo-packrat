import passport from 'passport';
import { LocalStrategy } from './strategies';

passport.use(LocalStrategy);

passport.serializeUser((user, done) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore //FIXME: serializer (depends on verify function)
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    // TODO: de serialize user here
    done(null, { id });
});

export default passport;
