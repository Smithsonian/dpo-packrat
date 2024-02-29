import express, { Request, Response, NextFunction, Router } from 'express';
import { passport } from './framework';
import * as LOG from '../utils/logger';

const AuthRouter: Router = express.Router();

AuthRouter.post('/login', (request: Request, response: Response, next: NextFunction) => {
    // LOG.info('AuthRouter.post login request received.',LOG.LS.eDEBUG);

    passport.authenticate('local', (error, user) => {
        if (error)
            return response.send({ success: false, message: error });
        return request.logIn(user, error => {   // assigns user to request.user
            if (error)
                return next(error);
            return response.send({ success: true });
        });
    })(request, response, next);
});

AuthRouter.get('/logout', (request: Request, response: Response) => {
    request['logout'](err => {
        LOG.error('Auth logout', LOG.LS.eSYS, err);
    });
    response.send({ success: true });
});

export default AuthRouter;
