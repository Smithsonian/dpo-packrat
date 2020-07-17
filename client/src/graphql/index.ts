import ApolloClient from 'apollo-boost';

function configureApolloClient(): ApolloClient<unknown> {
    const { REACT_APP_GRAPHQL_ENDPOINT } = process.env;

    if (!REACT_APP_GRAPHQL_ENDPOINT) {
        throw new Error('REACT_APP_GRAPHQL_ENDPOINT was not provided to apollo client');
    }

    const client = new ApolloClient({
        uri: REACT_APP_GRAPHQL_ENDPOINT
    });

    return client;
}

export { configureApolloClient };
export * from './queries';
