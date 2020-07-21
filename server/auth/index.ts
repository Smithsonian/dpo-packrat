import passport from './interface';
import AuthRouter from './router';
import session from 'express-session';
import MemoryStore from 'memorystore';

const { CLIENT_ENDPOINT, SESSION_SECRET } = process.env;

if (!CLIENT_ENDPOINT) {
    throw new Error('CLIENT_ENDPOINT was not provided to cors config');
}

const authCorsConfig = {
    origin: CLIENT_ENDPOINT,
    credentials: true
};

/**
 * To persist sessions we'll require to store them in our DB
 * https://www.npmjs.com/package/express-mysql-session
 */

if (!SESSION_SECRET) {
    throw new Error('SESSION_SECRET was not provided to sessions config');
}

const maxAge = Date.now() + 24 * 60 * 60 * 1000;
const checkPeriod = 24 * 60 * 60;

const Store = MemoryStore(session);

const sessionConfig = {
    cookie: { maxAge, expires: new Date(maxAge) }, // 24hrs expiration time
    secret: SESSION_SECRET, // TODO: turn this into env
    resave: true,
    saveUninitialized: true,
    store: new Store({
        checkPeriod // prune expired entries every 24h
    })
};

const authSession = session(sessionConfig);

export { passport, authCorsConfig, authSession, AuthRouter };
