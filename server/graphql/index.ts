import { Request } from 'express';
import { ApolloServerExpressConfig, AuthenticationError } from 'apollo-server-express';

import GraphQLApi from './api';
import schema from './schema';
import { isAuthenticated } from '../http/auth';
import * as COMMON from '@dpo-packrat/common';
import * as H from '../utils/helpers';
import { RecordKeeper as RK } from '../records/recordKeeper';

const unauthenticatedGQLQueries: Set<string> = new Set<string>([
    'getCurrentUser',
    'getVocabularyEntries(input: $input)',
    'getLicenseList(input: $input)',
    'getAllUsers(input: $input)',
]);

const ApolloServerOptions: ApolloServerExpressConfig = {
    schema,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const origError: any = err.extensions?.exception || err.originalError || err;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stack = origError?.stack || (err as any)?.stack || '(no stack)';

        // Client-side errors (auth, validation, bad input, parse) are not server
        // faults — record them at debug so they neither read as server errors nor
        // add error-log noise. Genuine server failures still log at error.
        const code: unknown = err.extensions?.code;
        if (typeof code === 'string' && CLIENT_ERROR_CODES.has(code)) {
            RK.logDebug(RK.LogSection.eGQL,'Apollo client error',`${code}: ${H.Helpers.getErrorString(err)}`,{},'GraphQL.Apollo.ServerOptions');
            return err;
        }

        RK.logError(RK.LogSection.eGQL,'Apollo server failed',`format error: ${H.Helpers.getErrorString(err)}`,{},'GraphQL.Apollo.ServerOptions');
        RK.logError(RK.LogSection.eGQL,'Apollo server failed (stack)',`${stack}`,{},'GraphQL.Apollo.ServerOptions');
        return err;
    }
};

// Apollo error codes that indicate a client-side problem, not a server fault.
const CLIENT_ERROR_CODES: Set<string> = new Set<string>([
    'UNAUTHENTICATED', 'FORBIDDEN', 'BAD_USER_INPUT',
    'GRAPHQL_VALIDATION_FAILED', 'GRAPHQL_PARSE_FAILED',
    'PERSISTED_QUERY_NOT_FOUND', 'PERSISTED_QUERY_NOT_SUPPORTED',
]);

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
