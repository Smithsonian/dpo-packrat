/**
 * DPO-PACKRAT/SERVER
 *
 * Entry file for server
 */

import * as path from 'path';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import schema from './graphql/schema';
import * as LOG from './utils/logger';

const logPath: string = './logs';
LOG.configureLogger(logPath);
LOG.logger.info('**************************');
LOG.logger.info('Packrat Server Initialized');
LOG.logger.info(`Packrat writing logs to ${path.resolve(logPath)}`);
const app = express();
app.use(cors());

const PORT = 4000;

const server = new ApolloServer({ schema });
server.applyMiddleware({ app });

app.listen(PORT, () => {
    console.log('GraphQL Server is running');
});

app.get('/logtest', (request, response) => {
    request;
    const log: LOG.Logger = LOG.getRequestLogger();
    log.info('Logger Info Test');
    log.error('Logger Error Test', new Error());
    response.send('Got Here');
});