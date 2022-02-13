import { Request } from 'express';
import { ApolloServerExpressConfig, AuthenticationError } from 'apollo-server-express';

import GraphQLApi from './api';
import schema from './schema';
import { isAuthenticated } from '../http/auth';
import * as LOG from '../utils/logger';
import * as COMMON from '@dpo-packrat/common';

const unauthenticatedGQLQueries: Set<string> = new Set<string>([
    'getCurrentUser',
    'getVocabularyEntries(input: $input)',
    'getLicenseList(input: $input)',
    'getAllUsers(input: $input)',
]);

const ApolloServerOptions: ApolloServerExpressConfig = {
    schema,
    uploads: false,
    context: ({ req }) => {
        if (!isAuthenticated(req)) {
            const gqlQuery: string = computeGQLQuery(req) || '';
            if (!unauthenticatedGQLQueries.has(gqlQuery))
                throw new AuthenticationError(`${COMMON.authenticationFailureMessage} for ${gqlQuery}`);
        }

        return {
            user: req['user'],
            isAuthenticated: req['isAuthenticated']()
        };
    },
    formatError: (err) => {
        LOG.error('ApolloServer Error:', LOG.LS.eGQL, err);
        return err;
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
