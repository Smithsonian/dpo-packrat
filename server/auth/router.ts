import express, { Request, Response } from 'express';
import passport from './passport';

const AuthRouter = express.Router();

AuthRouter.post('/login', passport.authenticate('local'), (request: Request, response: Response) => {
    if (!request['user']) {
        response.send({ success: false });
    }
    response.send({ success: true });
});

AuthRouter.get('/logout', (request: Request, response: Response) => {
    request['logout']();
    response.send({ success: true });
});

export default AuthRouter;
