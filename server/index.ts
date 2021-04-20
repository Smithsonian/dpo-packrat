/**
 * DPO-PACKRAT/SERVER
 *
 * Entry file for server
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import { passport, authCorsConfig, authSession, AuthRouter } from './auth';
import { ApolloServerOptions, computeGQLQuery } from './graphql';
import { IndexSolr } from './navigation/impl/NavigationSolr/IndexSolr';
import * as LOG from './utils/logger';
import { ASL, LocalStore } from './utils/localStore';

LOG.info('**************************', LOG.LS.eSYS);
LOG.info('Packrat Server Initialized', LOG.LS.eSYS);

const app = express();
const PORT = 4000;

const idRequestMiddleware = (req: Request, _res, next) => { // creates a LocalStore populated with the next requestID
    if (!req.originalUrl.startsWith('/auth/') && !req.originalUrl.startsWith('/graphql')) {
        const user = req['user'];
        const idUser = user ? user['idUser'] : undefined;
        ASL.run(new LocalStore(true, idUser), () => {
            LOG.info(req.originalUrl, LOG.LS.eHTTP);
            next();
        });
    } else
        next();
};

const idRequestMiddleware2 = (req, _res, next) => { // creates a LocalStore populated with the next requestID
    const user = req['user'];
    const idUser = user ? user['idUser'] : undefined;
    ASL.run(new LocalStore(true, idUser), () => {
        if (!req.originalUrl.startsWith('/graphql'))
            LOG.info(req.originalUrl, LOG.LS.eHTTP);
        next();
    });
};

const graphqlLoggingMiddleware = (req, _res, next) => {
    const query: string | null = computeGQLQuery(req);
    if (query && query !== '__schema') // silence __schema logging, issued by GraphQL playground
        LOG.info(`${query} ${JSON.stringify(req.body.variables)}`, LOG.LS.eGQL);
    return next();
};

app.use(idRequestMiddleware);
app.use(cors(authCorsConfig));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authSession);
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', idRequestMiddleware2);
app.use('/auth', AuthRouter);
app.use('/graphql', idRequestMiddleware2);
app.use('/graphql', graphqlLoggingMiddleware);

const server = new ApolloServer(ApolloServerOptions);
server.applyMiddleware({ app, cors: false });

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        LOG.info('Server is running', LOG.LS.eSYS);
    });
}

app.get('/logtest', (_: Request, response: Response) => {
    LOG.info('Logger Info Test', LOG.LS.eSYS);
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
