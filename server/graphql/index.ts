import GraphQLApi from './api';
import schema from './schema';
// import * as LOG from '../utils/logger';
import { ApolloServerExpressConfig /*, AuthenticationError */ } from 'apollo-server-express';

// const AUTH_REQUIRED: boolean = true;
// let requestNumber: number = 0;

const ApolloServerOptions: ApolloServerExpressConfig = {
    schema,
    context: ({ req }) => {
        // LOG.logger.info(`[${++requestNumber}]`);
        const user = req['user'];
        const isAuthenticated = req['isAuthenticated']();

        // if (AUTH_REQUIRED && !user)
        //     throw new AuthenticationError('GraphQL user is not authenticated');

        return {
            user,
            isAuthenticated
        };
    }
};

export { GraphQLApi as default, schema, ApolloServerOptions };
