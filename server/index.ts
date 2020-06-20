/**
 * DPO-PACKRAT/SERVER
 *
 * Entry file for server
 */

import express from 'express';
import cors from 'cors';
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express';
import schema from './graphql/schema';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(cors());

const PORT = 4000;

const prisma = new PrismaClient();

const serverOptions: ApolloServerExpressConfig = {
    schema,
    context: (context) => ({
        ...context,
        prisma
    })
};

const server = new ApolloServer(serverOptions);
server.applyMiddleware({ app });

app.listen(PORT, () => {
    console.log('GraphQL Server is running');
});
