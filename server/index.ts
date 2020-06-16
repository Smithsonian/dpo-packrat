/**
 * DPO-PACKRAT/SERVER
 *
 * Entry file for server
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';

import { PrismaClient } from '@prisma/client';
import * as TEST from './tests';

import schema from './graphql/schema';

const prisma = new PrismaClient();
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
    let responseMessage: string = `Hello from Packrat server @ ${hostname}:</br>`;

    const TR: TEST.TestResult = await TEST.testCreate(prisma);
    response.send(responseMessage + TR.Message);
});