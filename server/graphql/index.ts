import GraphQLApi from './api';
import schema from './schema';
import { ApolloServerExpressConfig } from 'apollo-server-express';

const serverOptions: ApolloServerExpressConfig = {
    schema,
    context: ({ req }) => {
        const user = req['user'];
        const isAuthenticated = req['isAuthenticated']();

        return {
            user,
            isAuthenticated
        };
    }
};

export { GraphQLApi as default, schema, serverOptions };
