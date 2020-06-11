import { mergeResolvers, mergeTypeDefs, makeExecutableSchema } from 'graphql-tools';

import { assetTypes, assetResolvers } from './asset';
import { captureDataTypes, captureDataResolvers } from './capturedata';
import { licenceTypes, licenceResolvers } from './licence';
import { unitTypes, unitResolvers } from './unit';
import { modelTypes, modelResolvers } from './model';
import { sceneTypes, sceneResolvers } from './scene';
import { userTypes, userQueries, userResolvers } from './user';
import { vocabularyTypes, vocabularyResolvers } from './vocabulary';

import { GraphQLSchema } from 'graphql';

const resolvers = mergeResolvers([
    assetResolvers,
    captureDataResolvers,
    licenceResolvers,
    unitResolvers,
    modelResolvers,
    sceneResolvers,
    userResolvers,
    vocabularyResolvers,
]);

const typeDefs = mergeTypeDefs([
    assetTypes,
    captureDataTypes,
    licenceTypes,
    unitTypes,
    modelTypes,
    sceneTypes,
    vocabularyTypes,
    userTypes,
    userQueries
]);

const schema: GraphQLSchema = makeExecutableSchema({ typeDefs, resolvers });

export { schema as default, typeDefs };