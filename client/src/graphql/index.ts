/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GraphQL Client
 *
 * This file configures and exports apollo client and apollo uploader client.
 */
import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
import { createUploadLink } from 'apollo-upload-client';
import { apolloFetch } from './utils';
import { DocumentNode } from 'graphql';

function configureApolloClient(): ApolloClient<NormalizedCacheObject> {
    const { PACKRAT_REACT_APP_SERVER_ENDPOINT } = process.env;

    if (!PACKRAT_REACT_APP_SERVER_ENDPOINT) {
        throw new Error('PACKRAT_REACT_APP_SERVER_ENDPOINT was not provided to apollo client');
    }

    const uri: string = `${PACKRAT_REACT_APP_SERVER_ENDPOINT}/graphql`;

    const link = createUploadLink({
        uri,
        credentials: 'include',
        fetch: apolloFetch
    });

    const client = new ApolloClient({
        link,
        cache: new InMemoryCache()
    });

    return client;
}

const apolloClient = configureApolloClient();

interface IApolloUploader {
    mutation: DocumentNode;
    variables: unknown;
    useUpload: boolean;
    refetchQueries?: string[];
    onProgress: (event: ProgressEvent) => void;
    onCancel: (cancelHandler: () => void) => void;
}

const apolloUploader = (options: IApolloUploader): Promise<any> => {
    const { mutation, variables, useUpload, refetchQueries, onProgress, onCancel } = options;

    return apolloClient.mutate({
        mutation,
        variables,
        refetchQueries,
        context: {
            fetchOptions: {
                useUpload,
                onProgress,
                onCancel
            }
        }
    });
};

export { apolloClient, apolloUploader };
