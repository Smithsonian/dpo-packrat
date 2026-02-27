import { Request, Response } from 'express';
import { isAuthenticated } from '../../auth';
import { ASL, LocalStore } from '../../../utils/localStore';
import { WebDAVTokenStore } from '../WebDAVToken';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

export async function createWebDAVToken(req: Request, res: Response): Promise<void> {
    try {
        if (!isAuthenticated(req)) {
            RK.logError(RK.LogSection.eHTTP, 'webdav token failed', 'not authenticated', {}, 'HTTP.Route.Scene');
            res.status(401).json({ success: false, message: 'not authenticated' });
            return;
        }

        const LS: LocalStore | undefined = ASL.getStore();
        if (!LS || !LS.idUser) {
            RK.logError(RK.LogSection.eHTTP, 'webdav token failed', 'cannot get LocalStore or idUser', {}, 'HTTP.Route.Scene');
            res.status(401).json({ success: false, message: 'missing local store/user' });
            return;
        }

        const idSystemObject: number = parseInt(req.params.id, 10);
        if (isNaN(idSystemObject) || idSystemObject <= 0) {
            RK.logError(RK.LogSection.eHTTP, 'webdav token failed', 'invalid idSystemObject', { id: req.params.id }, 'HTTP.Route.Scene');
            res.status(400).json({ success: false, message: 'invalid scene id' });
            return;
        }

        const token: string = WebDAVTokenStore.generate(LS.idUser, idSystemObject);
        res.json({ success: true, data: { token } });
    } catch (error) {
        RK.logError(RK.LogSection.eHTTP, 'webdav token failed', `${error}`, {}, 'HTTP.Route.Scene');
        res.status(500).json({ success: false, message: 'internal error' });
    }
}
