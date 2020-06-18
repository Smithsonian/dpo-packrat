/**
 * DPO-PACKRAT/SERVER
 *
 * Entry file for server
 */

import express /*, { Request, Response } */ from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import schema from './graphql/schema';

const app = express();
app.use(cors());

const PORT = 4000;

const server = new ApolloServer({ schema });
server.applyMiddleware({ app });

app.listen(PORT, () => {
    console.log('GraphQL Server is running');
});
