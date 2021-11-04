import { Request } from 'express';
import * as http from 'http';

const httpAuthRequired: boolean = (process.env.NODE_ENV === 'production');

export function isAuthenticated(request: Request | http.IncomingMessage): boolean {
    return (!httpAuthRequired || request['user']) ? true : false;
}
