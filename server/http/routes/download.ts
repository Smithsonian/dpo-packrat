import * as DBAPI from '../../db';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import * as STORE from '../../storage/interface';
import { isAuthenticated } from '../auth';

import { Request, Response } from 'express';

const mime = require('mime-types');

/** Used to provide download access to assets. Access with one of the following URL query parameters set:
 * ?idAssetVersion=ID:  Downloads the specified version of the specified asset
 * ?idAsset=ID:         Downloads the most recent asset version of the specified asset
 * ?idSystemObject=ID:  Computes the assets attached to this system object.  If just one, downloads it alone.  If multiple, computes a zip and downloads that zip.
 */
export async function download(request: Request, response: Response): Promise<void> {
    if (!isAuthenticated(request)) {
        LOG.error('/download not authenticated', LOG.LS.eHTTP);
        response.sendStatus(403);
        return;
    }

    const idSystemObjectU = request.query.idSystemObject;
    const idAssetU = request.query.idAsset;
    const idAssetVersionU = request.query.idAssetVersion;
    const urlParamCount: number = (idSystemObjectU ? 1 : 0) + (idAssetU ? 1 : 0) + (idAssetVersionU ? 1 : 0);
    if (urlParamCount != 1) {
        LOG.error(`/download called with ${urlParamCount} parameters instead of 1`, LOG.LS.eHTTP);
        response.sendStatus(404);
        return;
    }

    if (idAssetVersionU) {
        const idAssetVersion: number | null = H.Helpers.safeNumber(idAssetVersionU);
        if (!idAssetVersion) {
            LOG.error(`/download?idAssetVersion=${idAssetVersionU} invalid parameter`, LOG.LS.eHTTP);
            response.sendStatus(404);
            return;
        }

        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
        if (!assetVersion) {
            LOG.error(`/download?idAssetVersion=${idAssetVersionU} invalid parameter`, LOG.LS.eHTTP);
            response.sendStatus(404);
            return;
        }

        return emitDownload(response, assetVersion);
    }

    if (idAssetU) {
        const idAsset: number | null = H.Helpers.safeNumber(idAssetU);
        if (!idAsset) {
            LOG.error(`/download?idAsset=${idAssetU} invalid parameter`, LOG.LS.eHTTP);
            response.sendStatus(404);
            return;
        }

        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(idAsset);
        if (!assetVersion) {
            LOG.error(`/download?idAsset=${idAssetU} unable to fetch asset version`, LOG.LS.eHTTP);
            response.sendStatus(404);
            return;
        }
        return emitDownload(response, assetVersion);
    }

    const idSystemObject: number | null = H.Helpers.safeNumber(idSystemObjectU);
    if (!idSystemObject) {
        LOG.error(`/download?idSystemObject=${idSystemObjectU} invalid parameter`, LOG.LS.eHTTP);
        response.sendStatus(404);
        return;
    }

    response.send(`Download idSystemObject=${idSystemObject}`);
}

async function emitDownload(response: Response, assetVersion: DBAPI.AssetVersion): Promise<void> {
    const idAssetVersion: number = assetVersion.idAssetVersion;
    const res: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersion(assetVersion);
    if (!res.success || !res.readStream) {
        LOG.error(`download idAssetVersion=${idAssetVersion} unable to read from storage: res.error`, LOG.LS.eHTTP);
        response.sendStatus(500);
        return;
    }
    const fileName: string = assetVersion.FileName;
    const mimeType: string = mime.lookup(assetVersion.FileName) || 'application/octet-stream';
    LOG.info(`download idAssetVersion=${idAssetVersion}, filename=${fileName}, mimetype=${mimeType}`, LOG.LS.eHTTP);

    response.setHeader('Content-disposition', 'attachment; filename=' + fileName);
    response.setHeader('Content-type', mimeType);
    res.readStream.pipe(response);
}
