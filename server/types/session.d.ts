import { AuthorizationContext } from '../auth/Authorization';

declare module 'express-session' {
    interface SessionData {
        authContext?: AuthorizationContext;
    }
}
