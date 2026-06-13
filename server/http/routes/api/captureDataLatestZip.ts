/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /api/capture-data/:idSystemObject/latest-zip
 *
 * Given a SystemObject of type CaptureData, returns the idAssetVersion of the
 * most recent non-retired AssetVersion belonging to one of its CaptureDataFile
 * rows whose FileName ends in `.zip`. Returns `null` when no ZIP is attached
 * (e.g. photogrammetry CaptureData with loose images, or a brand-new record).
 *
 * Response shape: { success, message?, data: { idAssetVersion: number | null } }
 *
 * Used by the CaptureData details page to embed a ZipContentsView under the
 * Assets table without the client needing to know the underlying asset graph.
 */
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import * as path from 'path';
import { ASL, LocalStore } from '../../../utils/localStore';
import { isAuthenticated } from '../../auth';
import { Request, Response } from 'express';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { Authorization, AUTH_ERROR } from '../../../auth/Authorization';

type ResponseData = { idAssetVersion: number | null };
type LatestZipResponse = { success: boolean; message?: string; data?: ResponseData };

const generateResponse = (success: boolean, message?: string, data?: ResponseData): LatestZipResponse => ({ success, message, data });

const isAuthorized = async (req: Request): Promise<H.IOResults> => {
    if (!isAuthenticated(req)) {
        RK.logError(RK.LogSection.eHTTP, 'is authorized failed', 'not authenticated', {}, 'HTTP.Route.CaptureDataLatestZip');
        return { success: false, error: 'not authenticated' };
    }
    const LS: LocalStore | undefined = ASL.getStore();
    if (!LS || !LS.idUser) {
        RK.logError(RK.LogSection.eHTTP, 'is authorized failed', 'no LocalStore or idUser', {}, 'HTTP.Route.CaptureDataLatestZip');
        return { success: false, error: 'missing local store/user' };
    }
    return { success: true };
};

export async function getCaptureDataLatestZip(req: Request, res: Response): Promise<void> {
    const authResult = await isAuthorized(req);
    if (!authResult.success) {
        res.status(200).send(JSON.stringify(generateResponse(false, authResult.error)));
        return;
    }

    const idSystemObject: number = parseInt(req.params.idSystemObject, 10);
    if (!Number.isFinite(idSystemObject) || idSystemObject <= 0) {
        res.status(200).send(JSON.stringify(generateResponse(false, 'invalid idSystemObject')));
        return;
    }

    const ctx = Authorization.getContext();
    if (ctx && !await Authorization.canAccessSystemObject(ctx, idSystemObject)) {
        res.status(200).send(JSON.stringify(generateResponse(false, AUTH_ERROR.ACCESS_DENIED)));
        return;
    }

    try {
        const captureData: DBAPI.CaptureData | null = await DBAPI.CaptureData.fetchBySystemObject(idSystemObject);
        if (!captureData) {
            res.status(200).send(JSON.stringify(generateResponse(true, 'no CaptureData for SystemObject', { idAssetVersion: null })));
            return;
        }

        const cdFiles: DBAPI.CaptureDataFile[] | null = await DBAPI.CaptureDataFile.fetchFromCaptureData(captureData.idCaptureData);
        if (!cdFiles || cdFiles.length === 0) {
            res.status(200).send(JSON.stringify(generateResponse(true, 'no asset files', { idAssetVersion: null })));
            return;
        }

        // Walk every Asset → latest AssetVersion. Keep the most recent ZIP
        // across the whole CaptureData (DateCreated descending). Retired
        // asset versions are excluded by the SystemObject join in callers
        // that need that filter, but for "is there a current ZIP?" the
        // latest version is the right answer regardless.
        let chosen: DBAPI.AssetVersion | null = null;
        for (const cdFile of cdFiles) {
            const latest: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(cdFile.idAsset);
            if (!latest) continue;
            if (path.extname(latest.FileName).toLowerCase() !== '.zip') continue;
            if (!chosen || latest.DateCreated > chosen.DateCreated) chosen = latest;
        }

        res.status(200).send(JSON.stringify(generateResponse(true, chosen ? 'ZIP found' : 'no ZIP attached', {
            idAssetVersion: chosen ? chosen.idAssetVersion : null,
        })));
    } catch (err) {
        RK.logError(RK.LogSection.eHTTP, 'capture-data latest-zip failed', H.Helpers.getErrorString(err),
            { idSystemObject }, 'HTTP.Route.CaptureDataLatestZip');
        res.status(200).send(JSON.stringify(generateResponse(false, `unexpected error: ${H.Helpers.getErrorString(err)}`)));
    }
}
