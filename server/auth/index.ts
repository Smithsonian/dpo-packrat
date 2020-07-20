import passport from './passport';
import AuthRouter from './router';

const authCorsConfig = {
    origin: 'http://localhost:3000', // TODO: turn this into env
    credentials: true
};

const sessionConfig = {
    secret: 'test', // TODO: turn this into env
    resave: true,
    saveUninitialized: true
};

export { passport, authCorsConfig, sessionConfig, AuthRouter };
