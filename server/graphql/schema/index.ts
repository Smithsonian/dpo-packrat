import { GraphQLSchema } from 'graphql';
import { join } from 'path';
import flatten from 'lodash/flatten';
import { mergeResolvers, mergeTypeDefs, makeExecutableSchema, loadFilesSync } from 'graphql-tools';

import { assetResolvers, assetResolversForTest } from './asset';
import { captureDataResolvers } from './capturedata';
import { licenseResolvers } from './license';
import { unitResolvers } from './unit';
import { modelResolvers } from './model';
import { sceneResolvers } from './scene';
import { userResolvers } from './user';
import { vocabularyResolvers } from './vocabulary';
import { workflowResolvers } from './workflow';
import { systemObjectResolvers } from './systemobject';
import { accessControlResolvers } from './accesscontrol';
import { ingestionResolvers } from './ingestion';
import { repositoryResolvers } from './repository';

const resolvers = mergeResolvers([
    assetResolvers,
    captureDataResolvers,
    licenseResolvers,
    unitResolvers,
    modelResolvers,
    sceneResolvers,
    userResolvers,
    vocabularyResolvers,
    workflowResolvers,
    systemObjectResolvers,
    accessControlResolvers,
    ingestionResolvers,
    repositoryResolvers
]);

// special flavor of GraphQL resolvers, which avoid explicit use of graphql-upload's GraphQLUpload
// resolver for "Upload" scalar; instead, use default Apollo resolver
const resolversForTest = mergeResolvers([
    assetResolversForTest,
    captureDataResolvers,
    licenseResolvers,
    unitResolvers,
    modelResolvers,
    sceneResolvers,
    userResolvers,
    vocabularyResolvers,
    workflowResolvers,
    systemObjectResolvers,
    accessControlResolvers,
    ingestionResolvers,
    repositoryResolvers
]);

const types = loadFilesSync(join(__dirname, './**/types.graphql'));
const queries = loadFilesSync(join(__dirname, './**/queries.graphql'));
const mutations = loadFilesSync(join(__dirname, './**/mutations.graphql'));

const typeDefs = mergeTypeDefs(flatten([types, queries, mutations]));

const schema: GraphQLSchema = makeExecutableSchema({ typeDefs, resolvers });
const schemaForTest: GraphQLSchema = makeExecutableSchema({ typeDefs, resolvers: resolversForTest });

export { schema as default, schemaForTest };
