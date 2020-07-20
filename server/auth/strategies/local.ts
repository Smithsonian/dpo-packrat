import { Strategy } from 'passport';
import PassportLocal from 'passport-local';

const LocalStrategy: Strategy = new PassportLocal.Strategy((username: string, password: string, done) => {
    /**
     * TODO: Here we need to check if user exists and password matches in our DB
     */
    const user = { id: 'user-id', name: 'Packrat user', username, password };
    done(null, user);
});

export default LocalStrategy;
