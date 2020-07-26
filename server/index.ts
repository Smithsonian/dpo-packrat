/**
 * DPO-PACKRAT/SERVER
 *
 * Entry file for server
 */

import * as path from 'path';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import { serverOptions } from './graphql';
import * as LOG from './utils/logger';
import bodyParser from 'body-parser';
import { passport, authCorsConfig, authSession, AuthRouter } from './auth';

import cookieParser from 'cookie-parser';

const logPath: string = './logs';
LOG.configureLogger(logPath);
LOG.logger.info('**************************');
LOG.logger.info('Packrat Server Initialized');
LOG.logger.info(`Packrat writing logs to ${path.resolve(logPath)}`);

const app = express();
const PORT = 4000;

app.use(cors(authCorsConfig));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authSession);
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', AuthRouter);

const server = new ApolloServer(serverOptions);
server.applyMiddleware({ app, cors: false });

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log('GraphQL Server is running');
    });
}

app.get('/logtest', (_: Request, response: Response) => {
    const log: LOG.Logger = LOG.getRequestLogger();
    log.info('Logger Info Test');
    log.error('Logger Error Test', new Error());
    response.send('Got Here');
});

export { app };
