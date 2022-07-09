/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GraphQL Client
 *
 * This file configures and exports apollo client and apollo uploader client.
 */
import { ApolloClient, InMemoryCache, NormalizedCacheObject, OperationVariables, MutationOptions, FetchResult, QueryOptions, ApolloQueryResult, ApolloClientOptions, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { createUploadLink } from 'apollo-upload-client';
import { apolloFetch, uploadFailureMessage } from './utils';
import { DocumentNode } from 'graphql';
import { ROUTES } from '../constants';
import { authenticationFailureMessage } from '@dpo-packrat/common';
import API from '../api';

import axios from 'axios';

class PRApolloClient extends ApolloClient<NormalizedCacheObject> {
    constructor(options: ApolloClientOptions<NormalizedCacheObject>) { // eslint-disable-line @typescript-eslint/no-useless-constructor
        super(options);
    }

    async query<T = any, TVariables = OperationVariables>(options: QueryOptions<TVariables>): Promise<ApolloQueryResult<T>> {
        let retValue: any;
        try {
            retValue = await super.query(options);
        } catch (error) {
            this.handleException(error);
        }
        return retValue;
    }

    async mutate<T = any, TVariables = OperationVariables>(options: MutationOptions<T, TVariables>): Promise<FetchResult<T>> {
        // console.log('PRApolloClient.mutate');
        let retValue: any;
        try {
            retValue = await super.mutate(options);
        } catch (error) {
            this.handleException(error);
        }
        return retValue;
    }

    private handleException(error: any): void {
        const message: string = (error instanceof Error) ? `: ${error.message}` : '';
        console.log(`Apollo Client Error${message}`);
        // console.log(`Apollo Client Error${message}: ${JSON.stringify(error)}`);
        throw error;
    }
}

const loginMessage: string = 'The Packrat user is no longer authenticated. Please login.';
const SAMLRedirectPath: string = '/saml/idp/profile/redirectorpost/sso';

const errorLink = onError(({ graphQLErrors, networkError }) => {
    let sentToLogin: boolean = false;

    if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) => {
            console.log(`[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`);
            if (message.includes(authenticationFailureMessage)) {
                if (!sentToLogin) {
                    global.alert(loginMessage);
                    window.location.href = ROUTES.LOGIN;
                    sentToLogin = true;
                }
            }
        });
    }

    if (networkError) {
        console.log(`[Network error]: ${networkError}`);
        // console.log(`[Network error]: ${JSON.stringify(networkError)}`);

        if (!sentToLogin) {
            let redirectToLogin: boolean = false;

            if (networkError.name === 'ServerParseError') {
                const bodyText = networkError['bodyText'];
                if (bodyText && typeof(bodyText) === 'string' && bodyText.includes(SAMLRedirectPath)) {
                    if (!handleTeleworkSAMLAuthRequest(bodyText))
                        redirectToLogin = true;
                }
            } else {
                const errMessage: string = networkError.toString();
                if (errMessage !== 'TypeError: Failed to fetch' &&
                    errMessage !== 'ServerParseError: Unexpected token < in JSON at position 0' && // emitted on telework connections for unknown reasons
                    errMessage !== `TypeError: ${uploadFailureMessage}`)
                    redirectToLogin = true;
            }

            if (redirectToLogin) {
                global.alert(loginMessage);
                window.location.href = ROUTES.LOGIN;
                sentToLogin = true;
            }
        }
    }
});

function handleTeleworkSAMLAuthRequest(bodyText: string): boolean {
    try {
        const parser: DOMParser = new DOMParser();
        const document: Document = parser.parseFromString(bodyText, 'text/html');
        const forms: HTMLCollectionOf<HTMLFormElement> = document.getElementsByTagName('form');
        if (forms.length !== 1)
            return false;

        const form: HTMLFormElement = forms[0];
        if (!form.action.endsWith(SAMLRedirectPath))
            return false;

        console.log(`Packrat executing telework SAML Auth Requestion via ${form.method} to ${form.action}`);
        let retVal: boolean = true;
        // form.submit();
        const formElements: HTMLFormControlsCollection = form.elements;
        const SAMLRequestInput = formElements.namedItem('SAMLRequest');
        const RelayStateInput  = formElements.namedItem('RelayState');
        const SAMLRequest: string = (SAMLRequestInput instanceof HTMLInputElement) ? SAMLRequestInput.value : '';
        const RelayState:  string = (RelayStateInput  instanceof HTMLInputElement) ? RelayStateInput.value  : '';
        switch (form.method.toLowerCase()) {
            case 'post':
                axios.post(form.action, { SAMLRequest, RelayState })
                    .then(res => { console.log(`SAMLAuthRequest statusCode: ${res.status}`); console.log(`SAMLAuthRequest response ${res}`); })
                    .catch(error => { console.log(`SAMLAuthRequest failed ${error}`); retVal = false; });
                break;
            case 'get':
                axios.get(`${form.action}?SAMLRequest=${encodeURIComponent(SAMLRequest)}&RelayState=${encodeURIComponent(RelayState)}`)
                    .then(res => { console.log(`SAMLAuthRequest statusCode: ${res.status}`); console.log(`SAMLAuthRequest response ${res}`); })
                    .catch(error => { console.log(`SAMLAuthRequest failed ${error}`); retVal = false; });
                break;
        }

        return retVal;
    } catch (error) {
        console.log(`handleTeleworkSAMLAuthRequest failed with ${error} handling ${bodyText}`);
        return false;
    }
}

function configureApolloClient(): ApolloClient<NormalizedCacheObject> {
    const serverEndpoint = API.serverEndpoint();
    const uri: string = `${serverEndpoint}/graphql`;
    console.log(`Packrat using server endpoint ${serverEndpoint} to access graphql @ ${uri}`);

    const uploadLink = createUploadLink({
        uri,
        credentials: 'include',
        fetch: apolloFetch
    });

    const client = new PRApolloClient({
        link: from([errorLink, uploadLink]),
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

async function apolloUploader(options: IApolloUploader): Promise<any> {
    const { mutation, variables, useUpload, refetchQueries, onProgress, onCancel } = options;

    // console.log('apolloUploader apolloClient.mutate');
    return await apolloClient.mutate({
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
}

export { apolloClient, apolloUploader };
