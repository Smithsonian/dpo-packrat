import { mergeResolvers, mergeTypeDefs, makeExecutableSchema, } from 'graphql-tools';

import { userTypes, userQueries, userResolvers } from './user';

const resolvers = mergeResolvers([
    userResolvers,
]);

const typeDefs = mergeTypeDefs([
    userTypes,
    userQueries
]);

const schema = makeExecutableSchema({ typeDefs, resolvers });

export default schema;