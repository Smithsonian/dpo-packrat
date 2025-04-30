import express, { Request, Response, NextFunction, Router } from 'express';
import { passport } from './framework';
import * as H from '../utils/helpers';
import { RecordKeeper as RK } from '../records/recordKeeper';

const AuthRouter: Router = express.Router();

AuthRouter.post('/login', (req: Request, res: Response, next: NextFunction) => {
    
    passport.authenticate('local', (error, user) => {
        const { ip } = H.Helpers.getUserDetailsFromRequest(req);

        if (error) {
            RK.logDebug(RK.LogSection.eAUTH,'user login failed',error,{ ip },'AuthRouter',true);
            return res.send({ success: false, message: error });
        }
        return req.logIn(user, error => {   // assigns user to request.user
            if (error) {
                RK.logDebug(RK.LogSection.eAUTH,'user login failed',error, { ip },'AuthRouter',true);
                return next(error);
            }

            RK.logDebug(RK.LogSection.eAUTH,'user login success',undefined, { idUser: user.idUser, name: user.Name, email: user.EmailAddress, ip },'AuthRouter',true);
            return res.send({ success: true });
        });
    })(req, res, next);
});

AuthRouter.get('/logout', (req: Request, res: Response) => {
    
    const { id, ip } = H.Helpers.getUserDetailsFromRequest(req);
    
    req['logout'](err => {
        if(err) {
            RK.logDebug(RK.LogSection.eAUTH,'user logout failed',err,{ idUser: id, ip },'AuthRouter',true);
            res.send({ success: false, message: err });
        } else {
            RK.logDebug(RK.LogSection.eAUTH,'user logout success',undefined,{ idUser: id, ip },'AuthRouter',true);
            res.send({ success: true });
        }
    });   
});

export default AuthRouter;
