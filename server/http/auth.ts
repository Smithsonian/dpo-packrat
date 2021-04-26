import { Request } from 'express';

const httpAuthRequired: boolean = (process.env.NODE_ENV === 'production');

export function isAuthenticated(request: Request): boolean {
    return (!httpAuthRequired || request.user) ? true : false;
}
