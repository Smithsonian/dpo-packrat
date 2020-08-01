/* eslint-disable @typescript-eslint/no-explicit-any */
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';
import ApolloClient from 'apollo-client';
import { createUploadLink } from 'apollo-upload-client';
import { apolloFetch } from './utils';
import { DocumentNode } from 'graphql';

function configureApolloClient(): ApolloClient<NormalizedCacheObject> {
    const { REACT_APP_SERVER_ENDPOINT } = process.env;

    if (!REACT_APP_SERVER_ENDPOINT) {
        throw new Error('REACT_APP_SERVER_ENDPOINT was not provided to apollo client');
    }

    const uri: string = `${REACT_APP_SERVER_ENDPOINT}/graphql`;

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
    onProgress: (event: ProgressEvent) => void;
    onAbort: (abortHandler: () => void) => void;
}

const apolloUploader = (options: IApolloUploader): Promise<any> => {
    const { mutation, variables, useUpload, onProgress, onAbort } = options;

    return apolloClient.mutate({
        mutation,
        variables,
        context: {
            fetchOptions: {
                useUpload,
                onProgress,
                onAbort
            }
        }
    });
};

export { apolloClient, apolloUploader };

export * from './mutations';
export * from './queries';
