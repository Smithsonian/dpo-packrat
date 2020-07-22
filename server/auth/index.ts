import { passport } from './framework';
import AuthRouter from './AuthRouter';
import session from 'express-session';
import MemoryStore from 'memorystore';
import Config from '../config';

const { CLIENT_ENDPOINT, SESSION_SECRET } = process.env;

if (!CLIENT_ENDPOINT) {
    throw new Error('CLIENT_ENDPOINT was not provided to cors config');
}

const authCorsConfig = {
    origin: CLIENT_ENDPOINT,
    credentials: true
};

if (!SESSION_SECRET) {
    throw new Error('SESSION_SECRET was not provided to sessions config');
}

/**
 * To persist sessions we'll require to store them in our DB
 * https://www.npmjs.com/package/express-mysql-session
 */

const Store = MemoryStore(session);

const { maxAge, checkPeriod, expires } = Config.auth.session;

const sessionConfig = {
    cookie: {
        maxAge,
        expires
    },
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new Store({ checkPeriod })
};

const authSession = session(sessionConfig);

export { passport, authCorsConfig, authSession, AuthRouter };
