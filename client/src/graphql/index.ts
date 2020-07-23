import ApolloClient from 'apollo-boost';

function configureApolloClient(): ApolloClient<unknown> {
    const { REACT_APP_SERVER_ENDPOINT } = process.env;

    if (!REACT_APP_SERVER_ENDPOINT) {
        throw new Error('REACT_APP_SERVER_ENDPOINT was not provided to apollo client');
    }

    const uri: string = `${REACT_APP_SERVER_ENDPOINT}/graphql`;

    const client = new ApolloClient({
        uri,
        credentials: 'include'
    });

    return client;
}

const apolloClient = configureApolloClient();

export { apolloClient };
export * from './queries';
