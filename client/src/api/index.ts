/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API (REST)
 *
 * This class is responsible for performing REST operations such
 * as login and logout.
 */
enum API_ROUTES {
    LOGIN = 'auth/login',
    LOGOUT = 'auth/logout'
}

export type AuthResponseType = {
    success: boolean;
    message?: string;
    originalUrl?: string;
};

export default class API {
    static async login(email: string, password: string): Promise<AuthResponseType> {
        const body = JSON.stringify({ email, password });
        const options = {
            method: 'POST',
            body
        };

        return this.request(API_ROUTES.LOGIN, options);
    }

    static async logout(): Promise<AuthResponseType> {
        return this.request(API_ROUTES.LOGOUT);
    }

    static async request(route: string, options: RequestInit = {}): Promise<any> {
        const serverEndpoint = API.serverEndpoint();
        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            ...options
        };

        return fetch(`${serverEndpoint}/${route}`, defaultOptions).then(response => response.json());
    }

    static serverEndpoint(): string {
        // If we're accessing Packrat via Telework, hard-code server path to the server directory of the host root
        switch (window.location.hostname.toLowerCase()) {
            case 'packrat-telework.si.edu':         return 'https://packrat-telework.si.edu/server';        // production
            case 'packrat-test-telework.si.edu':    return 'https://packrat-test-telework.si.edu/server';   // staging
        }

        const { REACT_APP_PACKRAT_SERVER_ENDPOINT } = process.env;
        if (!REACT_APP_PACKRAT_SERVER_ENDPOINT)
            throw new Error('REACT_APP_PACKRAT_SERVER_ENDPOINT is not defined!');

        return REACT_APP_PACKRAT_SERVER_ENDPOINT;
    }
}
