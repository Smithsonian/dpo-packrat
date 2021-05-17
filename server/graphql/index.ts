import { Request } from 'express';
import { ApolloServerExpressConfig, AuthenticationError } from 'apollo-server-express';

import GraphQLApi from './api';
import schema from './schema';
import * as LOG from '../utils/logger';

const gqlAuthRequired: boolean = (process.env.NODE_ENV === 'production'); // set to false for debugging GraphQL using the GQL Playground ... this lets us avoid authentication
const unauthenticatedGQLQueries: Set<string> = new Set<string>([
    'getCurrentUser',
    'getVocabularyEntries(input: $input)',
]);

const ApolloServerOptions: ApolloServerExpressConfig = {
    schema,
    uploads: false,
    context: ({ req }) => {
        const user = req['user'];
        const isAuthenticated = req['isAuthenticated']();

        if (gqlAuthRequired) {
            const gqlQuery: string = computeGQLQuery(req) || '';
            const authRequired: boolean = !unauthenticatedGQLQueries.has(gqlQuery);
            if (authRequired && !user) {
                LOG.error(`ApolloServerOptions.context GraphQL user is not authenticated for ${gqlQuery}`, LOG.LS.eGQL);
                throw new AuthenticationError('GraphQL user is not authenticated');
            }
        }

        return {
            user,
            isAuthenticated
        };
    }
};

function computeGQLQuery(req: Request): string | null {
    // extract first line of query string
    // e.g. query = '{\n  getAssetVersionsDetails(input: {idAssetVersions: [101]}) {\n...'
    const query: string | undefined = req.body.query;
    if (!query)
        return null;
    let start: number = query.indexOf('{\n');
    if (start > -1)
        start += 2; // skip two spaces found after {\n
    const end: number = query.indexOf('{\n', start + 1);
    const queryTrim: string = (start > -1 && end > -1) ? query.substring(start + 1, end).trim() : '';
    return queryTrim;
}

export { GraphQLApi as default, schema, ApolloServerOptions, computeGQLQuery };
