/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API (REST)
 *
 * This class is responsible for performing REST operations such
 * as login and logout.
 */
enum API_ROUTES {
    LOGIN = 'auth/login',
    LOGOUT = 'auth/logout',
    GEN_DOWNLOADS = 'api/scene/gen-downloads',
    GEN_SCENE = 'api/workflow/gen-scene',
    PROJECTS = 'api/project',
    REPORT = 'api/report'
}

export type AuthResponseType = {
    success: boolean;
    message?: string;
    originalUrl?: string;
};

export type RequestResponse = {
    success: boolean;
    message?: string;
    originalUrl?: string;
    data?: any;
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

    // generation operations
    static async generateDownloads(idSystemObject: number[], statusOnly: boolean = false, rePublish: boolean = false): Promise<RequestResponse> {
        // initiates the generate downloads routine and either runs the recipe with the given id or returns its status.
        // idSystemObject = the SystemObject id for the Packrat Scene making this request
        const body = JSON.stringify({ statusOnly, rePublish, idSystemObject });
        let uri: string = API_ROUTES.GEN_DOWNLOADS;
        console.log('[PACKRAT:DEBUG] body: ',body);

        let options;
        if(statusOnly) {
            options = { method: 'GET' };
            uri += `?id=${idSystemObject[0]}`; // add our index. only get status for single element
        } else {
            options = { method: 'POST', body };
        }

        return this.request(uri, options);
    }
    static async generateScene(idSystemObject: number[], statusOnly: boolean = false, includeExisting: boolean = false): Promise<RequestResponse> {
        // initiates the generate scene routine and either runs the recipe with the given id or returns its status.
        // idSystemObject = the SystemObject id for the Packrat Model/Scene making this request
        const body = JSON.stringify({ statusOnly, includeExisting, idSystemObject });
        let uri: string = API_ROUTES.GEN_SCENE;
        console.log('[PACKRAT:DEBUG] body: ',body);
        console.trace('API.generateScene');

        let options;
        if(statusOnly) {
            options = { method: 'GET' };
            uri += `?id=${idSystemObject[0]}`; // add our index. only get status for single element
        } else {
            options = { method: 'POST', body };
        }

        return this.request(uri, options);
    }

    // project operations
    static async getProjects(): Promise<RequestResponse> {
        return this.request(`${API_ROUTES.PROJECTS}`, { method: 'GET' });
    }
    static async getProjectScenes(idProject: number): Promise<RequestResponse> {
        return this.request(`${API_ROUTES.PROJECTS}/${idProject}/scenes`, { method: 'GET' });
    }

    // validation
    static async getReport(type: string): Promise<RequestResponse> {
        return this.request(`${API_ROUTES.REPORT}/${type}`, { method: 'GET' });;
    }

    // general routines
    static async request(route: string, options: RequestInit = {}): Promise<any> {
        const serverEndpoint = API.serverEndpoint();
        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            ...options
        };

        // TODO: return an error response
        return fetch(`${serverEndpoint}/${route}`, defaultOptions)
            .then(response => {
                // Check if the response returned a successful status code
                if (!response.ok) {
                    console.log('response: ',response);
                    return { success: false, message: response.statusText };
                }
                return response.json(); // Assuming the server responds with JSON
            })
            .catch(error => {
                console.error(`[Packrat] could not complete request (${route}) due to error: ${error}`);
            });
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
