import { mergeResolvers, mergeTypeDefs, makeExecutableSchema } from 'graphql-tools';

import { userTypes, userQueries, userResolvers } from './user';
import { GraphQLSchema } from 'graphql';

const resolvers = mergeResolvers([
    userResolvers,
]);

const typeDefs = mergeTypeDefs([
    userTypes,
    userQueries
]);

const schema: GraphQLSchema = makeExecutableSchema({ typeDefs, resolvers });

export { schema as default, typeDefs };