import { passport, authCorsConfig, authSession, AuthRouter } from '../auth';
import { ApolloServerOptions, computeGQLQuery } from '../graphql';
import { EventFactory } from '../event/interface/EventFactory';
import { ASL, LocalStore } from '../utils/localStore';
import { Config } from '../config';
import * as LOG from '../utils/logger';

import { logtest } from './routes/logtest';
import { solrindex, solrindexprofiled } from './routes/solrindex';
import { download } from './routes/download';

import express, { Request } from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { graphqlUploadExpress } from 'graphql-upload';

/**
 * Singleton instance of HttpServer is retrieved via HttpServer.getInstance()
 * This object instantiates express(), wires together middleware, and perform initialization tasks
 */
export class HttpServer {
    public app = express();
    private static _singleton: HttpServer | null = null;

    static async getInstance(): Promise<HttpServer | null> {
        if (!HttpServer._singleton) {
            HttpServer._singleton = new HttpServer();
            await HttpServer._singleton.initializeServer();
        }
        return HttpServer._singleton;
    }

    private async initializeServer(): Promise<boolean> {
        LOG.info('**************************', LOG.LS.eSYS);
        LOG.info('Packrat Server Initialized', LOG.LS.eSYS);
        const res: boolean = await this.configureMiddlewareAndRoutes();

        // call to initalize the EventFactory, which in turn will initialize the AuditEventGenerator, supplying the IEventEngine
        EventFactory.getInstance();
        return res;
    }

    private async configureMiddlewareAndRoutes(): Promise<boolean> {
        this.app.use(HttpServer.idRequestMiddleware);
        this.app.use(cors(authCorsConfig));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(cookieParser());
        this.app.use(authSession);
        this.app.use(passport.initialize());
        this.app.use(passport.session());

        this.app.use('/auth', HttpServer.idRequestMiddleware2);
        this.app.use('/auth', AuthRouter);
        this.app.use('/graphql', HttpServer.idRequestMiddleware2);
        this.app.use('/graphql', HttpServer.graphqlLoggingMiddleware);

        const server = new ApolloServer(ApolloServerOptions);
        this.app.use(graphqlUploadExpress());
        server.applyMiddleware({ app: this.app, cors: false });

        this.app.get('/logtest', logtest);
        this.app.get('/solrindex', solrindex);
        this.app.get('/solrindexprofiled', solrindexprofiled);
        this.app.get('/download', download);

        if (process.env.NODE_ENV !== 'test') {
            this.app.listen(Config.http.port, () => {
                LOG.info(`Server is running on port ${Config.http.port}`, LOG.LS.eSYS);
            });
        }
        return true;
    }

    // creates a LocalStore populated with the next requestID
    private static idRequestMiddleware(req: Request, _res, next): void {
        if (!req.originalUrl.startsWith('/auth/') && !req.originalUrl.startsWith('/graphql')) {
            const user = req['user'];
            const idUser = user ? user['idUser'] : undefined;
            ASL.run(new LocalStore(true, idUser), () => {
                LOG.info(req.originalUrl, LOG.LS.eHTTP);
                next();
            });
        } else
            next();
    }

    private static idRequestMiddleware2(req: Request, _res, next): void {
        const user = req['user'];
        const idUser = user ? user['idUser'] : undefined;
        ASL.run(new LocalStore(true, idUser), () => {
            if (!req.originalUrl.startsWith('/graphql'))
                LOG.info(req.originalUrl, LOG.LS.eHTTP);
            next();
        });
    }

    private static graphqlLoggingMiddleware(req: Request, _res, next): void {
        const query: string | null = computeGQLQuery(req);
        if (query && query !== '__schema') // silence __schema logging, issued by GraphQL playground
            LOG.info(`${query} ${JSON.stringify(req.body.variables)}`, LOG.LS.eGQL);
        return next();
    }
}
