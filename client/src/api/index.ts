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
        const { PACKRAT_REACT_APP_SERVER_ENDPOINT } = process.env;

        if (!PACKRAT_REACT_APP_SERVER_ENDPOINT) {
            throw new Error('PACKRAT_REACT_APP_SERVER_ENDPOINT was not provided to rest api client');
        }

        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            ...options
        };

        return fetch(`${PACKRAT_REACT_APP_SERVER_ENDPOINT}/${route}`, defaultOptions).then(response => response.json());
    }
}
