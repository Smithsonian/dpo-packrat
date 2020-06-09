/**
 * DPO-PACKRAT/SERVER
 *
 * Entry file for server
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';

import { unit} from '@prisma/client';
import * as DBAPI from './db/api/';

import schema from './graphql/schema';

const app = express();
app.use(cors());

const PORT = 4000;

const server = new ApolloServer({ schema });
server.applyMiddleware({ app });

app.listen(PORT, () => {
    console.log('GraphQL Server is running');
});

app.get('/dbtest', (request: Request, response: Response) => {
    const { hostname } = request;
    let newUnit : unit = { Name: "DPO", Abbreviation: "DPO", ARKPrefix: "http://abbadabbadoo/", idUnit: 0 };
    DBAPI.createSystemObject(newUnit)
        .then((createdUnit) => { 
            response.send(`Hello from Packrat server @ ${hostname}: Created Unit with ID ${createdUnit.idUnit}`);
        })
        .catch(err => {
            console.log(err);
            response.send(`Hello from Packrat server @ ${hostname}: ${err}`);
        });
});