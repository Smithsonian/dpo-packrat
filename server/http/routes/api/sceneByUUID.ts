import { Request, Response } from 'express';
import * as DBAPI from '../../../db';
import { RouteBuilder, eHrefMode } from '../routeBuilder';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

export async function sceneByUUID(req: Request, res: Response): Promise<void> {
    try {
        const edanUUID: string = req.params.edanUUID;
        if (!edanUUID) {
            res.status(400).send('Missing EDAN UUID');
            return;
        }

        const scenes: DBAPI.Scene[] | null = await DBAPI.Scene.fetchByUUID(edanUUID);
        if (!scenes || scenes.length === 0) {
            RK.logError(RK.LogSection.eHTTP, 'scene by UUID failed', `no scene found for UUID ${edanUUID}`, {}, 'HTTP.Route.SceneByUUID');
            res.status(404).send('Scene not found for the provided EDAN UUID');
            return;
        }

        const scene: DBAPI.Scene = scenes[0];
        const systemObject: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetchFromSceneID(scene.idScene);
        if (!systemObject) {
            RK.logError(RK.LogSection.eHTTP, 'scene by UUID failed', `no SystemObject for idScene ${scene.idScene}`, {}, 'HTTP.Route.SceneByUUID');
            res.status(500).send('Unable to resolve scene');
            return;
        }

        const redirectUrl: string = RouteBuilder.RepositoryDetails(systemObject.idSystemObject, eHrefMode.ePrependClientURL);
        res.redirect(redirectUrl);
    } catch (error) {
        RK.logError(RK.LogSection.eHTTP, 'scene by UUID failed', `${error}`, {}, 'HTTP.Route.SceneByUUID');
        res.status(500).send('Internal error');
    }
}
