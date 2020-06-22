/**
 * DPO-PACKRAT/SERVER
 *
 * Entry file for server
 */

import * as path from 'path';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express';
import schema from './graphql/schema';
import * as LOG from './utils/logger';

import { PrismaClient } from '@prisma/client';

const logPath: string = './logs';
LOG.configureLogger(logPath);
LOG.logger.info('**************************');
LOG.logger.info('Packrat Server Initialized');
LOG.logger.info(`Packrat writing logs to ${path.resolve(logPath)}`);

const app = express();
app.use(cors());

const PORT = 4000;

const prisma = new PrismaClient();

const serverOptions: ApolloServerExpressConfig = {
    schema,
    context: context => ({
        ...context,
        prisma
    })
};

const server = new ApolloServer(serverOptions);
server.applyMiddleware({ app });

app.listen(PORT, () => {
    console.log('GraphQL Server is running');
});

app.get('/logtest', (_: Request, response: Response) => {
    const log: LOG.Logger = LOG.getRequestLogger();
    log.info('Logger Info Test');
    log.error('Logger Error Test', new Error());
    response.send('Got Here');
});
