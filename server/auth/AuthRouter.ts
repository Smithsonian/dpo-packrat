import express, { Request, Response, NextFunction, Router } from 'express';
import { passport } from './framework';
import { Authorization } from './Authorization';
import * as H from '../utils/helpers';
import { RecordKeeper as RK } from '../records/recordKeeper';

/**
 * Routes incoming requests/endpoints for login/logout to PassportJS for authentication
 * which in turn calls AuthFactory to create a Local/LDAPS implementation of IAuth.
 *
 * Note: passport only returns the user and error with user or error being null depending
 * on the error state. Thus, logging and auditing occurs inside AuthFactory where more
 * details are available. Here we just provide contextual IP adress for the request.
 */

const AuthRouter: Router = express.Router();

AuthRouter.post('/login', (req: Request, res: Response, next: NextFunction) => {

    passport.authenticate('local', (error, user) => {
        const { ip } = H.Helpers.getUserDetailsFromRequest(req);

        if (error) {
            RK.logDebug(RK.LogSection.eAUTH,'user login failed',error,{ ip },'Auth.Router',true);
            return res.send({ success: false, message: error });
        }
        return req.logIn(user, async (error) => {   // assigns user to request.user
            if (error) {
                RK.logDebug(RK.LogSection.eAUTH,'user login failed',error, { ip },'Auth.Router',true);
                return next(error);
            }

            // Build and cache authorization context in session
            try {
                const authContext = await Authorization.buildContext(user.idUser);
                req.session.authContext = authContext;
            } catch (err) {
                RK.logError(RK.LogSection.eAUTH,'buildContext failed during login',
                    err instanceof Error ? err.message : String(err), { idUser: user.idUser, ip },'Auth.Router');
            }

            RK.logDebug(RK.LogSection.eAUTH,'user login success',undefined, { idUser: user.idUser, name: user.Name, email: user.EmailAddress, ip },'Auth.Router',true);
            return res.send({ success: true });
        });
    })(req, res, next);
});

AuthRouter.get('/logout', (req: Request, res: Response) => {

    const { id, ip } = H.Helpers.getUserDetailsFromRequest(req);

    req['logout'](err => {
        if(err) {
            RK.logDebug(RK.LogSection.eAUTH,'user logout failed',err,{ idUser: id, ip },'Auth.Router',true);
            res.send({ success: false, message: err });
        } else {
            RK.logDebug(RK.LogSection.eAUTH,'user logout success',undefined,{ idUser: id, ip },'Auth.Router',true);
            res.send({ success: true });
        }
    });
});

export default AuthRouter;
