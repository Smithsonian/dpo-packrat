import passport from './passport';
import AuthRouter from './router';
import session from 'express-session';
import MemoryStore from 'memorystore';

const authCorsConfig = {
    origin: 'http://localhost:3000', // TODO: turn this into env
    credentials: true
};

const sessionAge = 24 * 60 * 60;
const Store = MemoryStore(session);

const sessionConfig = {
    cookie: { maxAge: sessionAge }, // 24hrs expiration time
    secret: 'test', // TODO: turn this into env
    resave: true,
    saveUninitialized: true,
    store: new Store({
        checkPeriod: sessionAge // prune expired entries every 24h
    })
};

const authSession = session(sessionConfig);

export { passport, authCorsConfig, authSession, AuthRouter };
