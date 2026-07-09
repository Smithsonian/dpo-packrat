import * as DBAPI from '../../../db';
import * as COMMON from '@dpo-packrat/common';
import { ASL, LocalStore } from '../../../utils/localStore';
import { isAuthenticated } from '../../auth';
import { Config } from '../../../config';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { Request, Response } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function respond(res: Response, success: boolean, message: string | undefined, data?: any): void {
    res.status(200).send(JSON.stringify({ success, message, data }));
}

/**
 * GET /api/scene/published — scenes whose latest version is in a published EDAN state, ordered
 * retired-first. Retired-and-published scenes are orphans (retired in Packrat but still live in
 * EDAN) that need reconciliation; each row carries its EdanUUID for that purpose. Admin/tools only.
 */
export async function getPublishedScenes(req: Request, res: Response): Promise<void> {
    if (!isAuthenticated(req)) {
        respond(res, false, 'getPublishedScenes: not authenticated');
        return;
    }
    const LS: LocalStore | undefined = ASL.getStore();
    if (!LS || !LS.idUser) {
        respond(res, false, 'getPublishedScenes: missing local store/user');
        return;
    }
    const authorized: number[] = [...new Set([...Config.auth.users.admin, ...Config.auth.users.tools])];
    if (!authorized.includes(LS.idUser)) {
        respond(res, false, 'getPublishedScenes: not authorized');
        return;
    }

    try {
        const rows: DBAPI.EdanPublishedSceneRow[] = await DBAPI.Scene.fetchEdanPublished();
        const scenes = rows.map(r => ({
            idScene: r.idScene,
            idSystemObject: r.idSystemObject,
            name: r.Name,
            edanUUID: r.EdanUUID,
            publishedState: COMMON.PublishedStateEnumToString(r.PublishedState),
            retired: r.Retired,
        }));
        const orphanCount: number = scenes.filter(s => s.retired).length;
        respond(res, true, undefined, { total: scenes.length, orphanCount, scenes });
    } catch (error) {
        RK.logError(RK.LogSection.eHTTP, 'getPublishedScenes failed',
            error instanceof Error ? error.message : String(error), undefined, 'HTTP.Route.PublishedScenes');
        respond(res, false, `getPublishedScenes: ${error instanceof Error ? error.message : 'unexpected error'}`);
    }
}
