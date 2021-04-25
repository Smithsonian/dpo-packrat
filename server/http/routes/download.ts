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
export async function download(request: Request, response: Response): Promise<boolean> {
    const DL: Downloader = new Downloader(request, response);
    return await DL.execute();
}

enum eDownloadMode {
    eAssetVersion,
    eAsset,
    eSystemObject,
    eUnknown
}

class Downloader {
    private request: Request;
    private response: Response;

    private eMode: eDownloadMode = eDownloadMode.eUnknown;
    private idAssetVersion: number | null = null;
    private idAsset: number | null = null;
    private idSystemObject: number | null = null;

    constructor(request: Request, response: Response) {
        this.request = request;
        this.response = response;
    }

    async execute(): Promise<boolean> {
        if (!isAuthenticated(this.request)) {
            LOG.error('/download not authenticated', LOG.LS.eHTTP);
            this.response.sendStatus(403);
            return false;
        }

        if (!this.parseArguments()) {
            this.response.sendStatus(404);
            return false;
        }

        switch (this.eMode) {
            case eDownloadMode.eAssetVersion: {
                const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(this.idAssetVersion!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                if (!assetVersion) {
                    LOG.error(`/download?idAssetVersion=${this.idAssetVersion} invalid parameter`, LOG.LS.eHTTP);
                    this.response.sendStatus(404);
                    return false;
                }
                return this.emitDownload(assetVersion);
            }

            case eDownloadMode.eAsset: {
                const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(this.idAsset!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                if (!assetVersion) {
                    LOG.error(`/download?idAsset=${this.idAsset} unable to fetch asset version`, LOG.LS.eHTTP);
                    this.response.sendStatus(404);
                    return false;
                }
                return await this.emitDownload(assetVersion);
            }

            case eDownloadMode.eSystemObject: {
                this.response.send(`Download idSystemObject=${this.idSystemObject}`);
            } break;
        }
        this.response.sendStatus(404);
        return false;
    }

    /** Returns false if arguments are invalid */
    private async parseArguments(): Promise<boolean> {
        const idSystemObjectU = this.request.query.idSystemObject;
        const idAssetU = this.request.query.idAsset;
        const idAssetVersionU = this.request.query.idAssetVersion;
        const urlParamCount: number = (idSystemObjectU ? 1 : 0) + (idAssetU ? 1 : 0) + (idAssetVersionU ? 1 : 0);
        if (urlParamCount != 1) {
            LOG.error(`/download called with ${urlParamCount} parameters, expected just 1`, LOG.LS.eHTTP);
            this.response.sendStatus(404);
            return false;
        }

        if (idAssetVersionU) {
            this.idAssetVersion = H.Helpers.safeNumber(idAssetVersionU);
            if (!this.idAssetVersion) {
                LOG.error(`/download?idAssetVersion=${idAssetVersionU}, invalid parameter`, LOG.LS.eHTTP);
                this.response.sendStatus(404);
                return false;
            }
            this.eMode = eDownloadMode.eAssetVersion;
        }

        if (idAssetU) {
            this.idAsset = H.Helpers.safeNumber(idAssetU);
            if (!this.idAsset) {
                LOG.error(`/download?idAsset=${idAssetU}, invalid parameter`, LOG.LS.eHTTP);
                this.response.sendStatus(404);
                return false;
            }
            this.eMode = eDownloadMode.eAsset;
        }

        if (idSystemObjectU) {
            this.idSystemObject = H.Helpers.safeNumber(idSystemObjectU);
            if (!this.idSystemObject) {
                LOG.error(`/download?idSystemObject=${idSystemObjectU} invalid parameter`, LOG.LS.eHTTP);
                this.response.sendStatus(404);
                return false;
            }
            this.eMode = eDownloadMode.eSystemObject;
        }

        return true;
    }

    private async emitDownload(assetVersion: DBAPI.AssetVersion): Promise<boolean> {
        const idAssetVersion: number = assetVersion.idAssetVersion;
        const res: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersion(assetVersion);
        if (!res.success || !res.readStream) {
            LOG.error(`download idAssetVersion=${idAssetVersion} unable to read from storage: ${res.error}`, LOG.LS.eHTTP);
            this.response.sendStatus(500);
            return false;
        }
        const fileName: string = assetVersion.FileName;
        const mimeType: string = mime.lookup(fileName) || 'application/octet-stream';
        return this.emitDownloadFromStream(res.readStream, fileName, mimeType);
    }

    private async emitDownloadFromStream(readStream: NodeJS.ReadableStream, fileName: string, mimeType: string | undefined): Promise<boolean> {
        if (!mimeType)
            mimeType = mime.lookup(fileName) || 'application/octet-stream';
        LOG.info(`/download emitDownloadFromStream filename=${fileName}, mimetype=${mimeType}`, LOG.LS.eHTTP);

        this.response.setHeader('Content-disposition', 'attachment; filename=' + fileName);
        if (mimeType)
            this.response.setHeader('Content-type', mimeType);
        readStream.pipe(this.response);
        return true;
    }
}
