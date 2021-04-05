/**
 * DPO-PACKRAT/SERVER
 *
 * Entry file for server
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerOptions } from './graphql';
import * as LOG from './utils/logger';
import bodyParser from 'body-parser';
import { passport, authCorsConfig, authSession, AuthRouter } from './auth';
import { IndexSolr } from './navigation/impl/NavigationSolr/IndexSolr';

import cookieParser from 'cookie-parser';

LOG.logger.info('**************************');
LOG.logger.info('Packrat Server Initialized');

const app = express();
const PORT = 4000;
let requestNumber: number = 0;

app.use(cors(authCorsConfig));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authSession);
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', AuthRouter);
app.use('/graphql', (req, _res, next) => {
    // extract first line of query string
    // e.g. query = '{\n  getAssetVersionsDetails(input: {idAssetVersions: [101]}) {\n...'
    const query: string | undefined = req.body.query;
    if (!query)
        return next();
    const log: LOG.Logger = LOG.getRequestLogger();
    let start: number = query.indexOf('{\n');
    if (start > -1)
        start += 2; // skip two spaces found after {\n
    const end: number = query.indexOf('{\n', start + 1);
    const queryTrim: string = (start > -1 && end > -1) ? query.substring(start + 1, end) : '';
    log.info(`GQL ${++requestNumber}: ${queryTrim}${JSON.stringify(req.body.variables)}`);
    return next();
});

const server = new ApolloServer(ApolloServerOptions);
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

app.get('/solrindex', async (_: Request, response: Response) => {
    const indexer: IndexSolr = new IndexSolr();
    const success: boolean = await indexer.fullIndex();
    response.send(`Solr Indexing Completed: ${success ? 'Success' : 'Failure'}`);
});

app.get('/solrindexprofiled', async (_: Request, response: Response) => {
    const indexer: IndexSolr = new IndexSolr();
    const success: boolean = await indexer.fullIndexProfiled();
    response.send(`Solr Indexing Completed: ${success ? 'Success' : 'Failure'}`);
});

export { app };
