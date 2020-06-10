/**
 * DPO-PACKRAT/SERVER
 *
 * Entry file for server
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';

import { unit } from '@prisma/client';
import * as DBAPI from './db/api';

import schema from './graphql/schema';

const app = express();
app.use(cors());

const PORT = 4000;

const server = new ApolloServer({ schema });
server.applyMiddleware({ app });

app.listen(PORT, () => {
    console.log('GraphQL Server is running');
});

app.get('/dbtest', async (request: Request, response: Response) => {
    const { hostname } = request;
    const newUnit: unit = {
        Name: 'DPO',
        Abbreviation: 'DPO',
        ARKPrefix: 'http://abbadabbadoo/',
        idUnit: 0
    };

    try {
        const createdUnit = await DBAPI.createSystemObject(newUnit);
        response.send(`Hello from Packrat server @ ${hostname}: Created Unit with ID ${createdUnit.idUnit}`);
    } catch (error) {
        console.log(error);
        response.send(`Hello from Packrat server @ ${hostname}: ${error}`);
    }
});