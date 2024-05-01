import { passport, authCorsConfig, authSession, AuthRouter } from '../auth';
import { ApolloServerOptions, computeGQLQuery } from '../graphql';
import { EventFactory } from '../event/interface/EventFactory';
import { ASL, LocalStore } from '../utils/localStore';
import { Config } from '../config';
import * as LOG from '../utils/logger';
import * as H from '../utils/helpers';
import { UsageMonitor } from '../utils/osStats';

import { logtest } from './routes/logtest';
import { heartbeat } from './routes/heartbeat';
import { solrindex, solrindexprofiled } from './routes/solrindex';
import { migrate } from './routes/migrate';
import { Downloader, download } from './routes/download';
import { errorhandler } from './routes/errorhandler';
import { WebDAVServer } from './routes/WebDAVServer';
import { getCookResource } from './routes/resources';
import { generateDownloads } from './routes/api/generateDownloads';

import express, { Request, Express, RequestHandler } from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import cookieParser from 'cookie-parser';
import { v2 as webdav } from 'webdav-server';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';

require('json-bigint-patch'); // patch JSON.stringify's handling of BigInt

const monitorCPU: boolean = true;
const monitorMem: boolean = true;
const monitorVerboseSamples: number = 300;

/**
 * Singleton instance of HttpServer is retrieved via HttpServer.getInstance()
 * This object instantiates express(), wires together middleware, and perform initialization tasks
 */
export class HttpServer {
    public app: Express = express();
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

        // configure our routes/endpoints
        const res: boolean = await this.configureMiddlewareAndRoutes();

        // call to initalize the EventFactory, which in turn will initialize the AuditEventGenerator, supplying the IEventEngine
        EventFactory.getInstance();
        if (monitorCPU) {
            const monitor: UsageMonitor = new UsageMonitor(1000, 90, 10, monitorMem, 90, 10, monitorVerboseSamples); // sample every second, alert if > 90% for more than 10 samples in a row, monitorVerboseSamples -> verbose logging, when != 0, every monitorVerboseSamples samples
            monitor.start();
        }
        return res;
    }

    static bodyProcessorExclusions: RegExp = /^\/(?!webdav).*$/;
    private async configureMiddlewareAndRoutes(): Promise<boolean> {
        // First step is to modify the request body as needed. We do this first
        // because the express.json() 3rd party library breaks any context created
        // by the AsyncLocalStore as it waits for the request/body to arrive.
        this.app.use(HttpServer.bodyProcessorExclusions, express.json() as RequestHandler); // do not extract webdav PUT bodies into request.body element
        this.app.use(HttpServer.bodyProcessorExclusions, express.urlencoded({ extended: true }) as RequestHandler);

        // get our cookie and auth system rolling. We do this here so we can extract
        // our user information (if present) and have it for creating the LocalStore.
        this.app.use(cors(authCorsConfig));
        this.app.use(cookieParser());
        this.app.use(authSession);
        this.app.use(passport.initialize());
        this.app.use(passport.session());

        // create our LocalStore for all future interactions
        this.app.use(HttpServer.logRequest);
        this.app.use(HttpServer.assignLocalStore);

        // authentication and graphQL endpoints
        this.app.use(HttpServer.checkLocalStore('0:Auth/GraphQL'));
        this.app.use('/auth', AuthRouter);
        this.app.use('/graphql', graphqlUploadExpress());

        // start our ApolloServer
        this.app.use(HttpServer.checkLocalStore('1:Apollo'));
        const server = new ApolloServer(ApolloServerOptions);
        await server.start();
        server.applyMiddleware({ app: this.app, cors: false });

        // utility endpoints
        this.app.use(HttpServer.checkLocalStore('2:Utility'));
        this.app.get('/logtest', logtest);
        this.app.get('/heartbeat', heartbeat);
        this.app.get('/solrindex', solrindex);
        this.app.get('/solrindexprofiled', solrindexprofiled);
        this.app.get('/migrate', migrate);
        this.app.get('/migrate/*', migrate);
        this.app.get(`${Downloader.httpRoute}*`, download);

        // Packrat API endpoints (WIP)
        this.app.use(HttpServer.checkLocalStore('3:API'));
        this.app.get('/resources/cook', getCookResource);
        this.app.get('/api/scene/gen-downloads', generateDownloads);
        this.app.post('/api/scene/gen-downloads', generateDownloads);

        // WebDAV storage (used for staging to Voyager/Cook)
        this.app.use(HttpServer.checkLocalStore('4:WebDAV'));
        const WDSV: WebDAVServer | null = await WebDAVServer.server();
        if (WDSV) {
            this.app.use(webdav.extensions.express(WebDAVServer.httpRoute, WDSV.webdav()));
            this.app.use(HttpServer.checkLocalStore('4b:WebDAV'));
        } else
            LOG.error('HttpServer.configureMiddlewareAndRoutes failed to initialize WebDAV server', LOG.LS.eHTTP);

        // if we're here then we handle any errors that may have surfaced
        this.app.use(errorhandler); // keep last

        // if we're not testing then open up server on the correct port
        if (process.env.NODE_ENV !== 'test') {
            this.app.listen(Config.http.port, () => {
                LOG.info(`Server is running on port ${Config.http.port}`, LOG.LS.eSYS);
            });
        }

        this.app.use(HttpServer.checkLocalStore('5:Exit'));
        return true;
    }

    // creates a LocalStore populated with the next requestID
    private static assignLocalStore(req: Request, _res, next): void {
        const user = req['user'];
        const idUser = user ? user['idUser'] : undefined;
        ASL.run(new LocalStore(true, idUser), () => {
            LOG.info(`HTTP.idRequestMiddleware creating new LocalStore (url: ${req.originalUrl} | idUser: ${idUser})`,LOG.LS.eHTTP);
            next();
        });
    }

    // utility routines and middleware
    private static logRequest(req: Request, _res, next): void {
        // TODO: more detailed information about the request
        // figure out who is calling this
        const user = req['user'];
        const idUser = user ? user['idUser'] : undefined;

        // our method (GET, POST, ...)
        let method = req.method.toUpperCase();

        // get our query
        let query = req.originalUrl;
        let queryParams = H.Helpers.JSONStringify(req.query);
        if(req.originalUrl.includes('/graphql')) {
            method = 'GQL';
            const queryGQL = computeGQLQuery(req);
            if(queryGQL && queryGQL !== '__schema') {
                query = queryGQL;
                queryParams = H.Helpers.JSONStringify(req.body.variables);
            } else
                query = 'Unknown GraphQL';
        }
        LOG.info(`New ${method} request [${query}] made by user ${idUser}. (${queryParams})`,LOG.LS.eHTTP);
        next();
    }
    private static checkLocalStore(label: string) {
        return function (req, _res, next) {
            LOG.info(`HTTP.checkLocalStore [${label}]. (url: ${req.originalUrl} | ${H.Helpers.JSONStringify(ASL.getStore())})`,LOG.LS.eDEBUG);
            next();
        };
    }
    // private static printRequest(req: Request, label: string = 'Request'): void {
    //     if(!req) {
    //         console.log('nothing');
    //     }
    //     LOG.info(`${label}: ${H.Helpers.JSONStringify({
    //         // headers: req.headers,
    //         // body: req.body,
    //         query: req.query,
    //         params: req.params,
    //         url: req.url,
    //         method: req.method,
    //         ip: req.ip,
    //         path: req.path,
    //         sid: req.cookies?.connect?.sid ?? undefined,
    //         // cookies: req.cookies,
    //         user: req.user
    //     })}`,LOG.LS.eDEBUG);
    // }
}

process.on('uncaughtException', (err) => {
    LOG.error('*** UNCAUGHT EXCEPTION ***', LOG.LS.eSYS, err);

    // For the time being, we prevent Node from exiting.
    // Once we've installed a process monitor in staging & production, like PM2, change this to
    // exit with a non-zero exit code
    // process.exit(1);
});