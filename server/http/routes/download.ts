import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import * as ZIP from '../../utils/zipStream';
import * as STORE from '../../storage/interface';
import { isAuthenticated } from '../auth';

import { Request, Response } from 'express';
import { ParsedQs } from 'qs';
import mime from 'mime'; // const mime = require('mime-types'); // can't seem to make this work using "import * as mime from 'mime'"; subsequent calls to mime.lookup freeze!
import path from 'path';

/** Used to provide download access to assets and reports. Access with one of the following URL patterns:
 * ASSETS:
 * /download?idAssetVersion=ID:         Downloads the specified version of the specified asset
 * /download?idAsset=ID:                Downloads the most recent asset version of the specified asset
 * /download?idSystemObject=ID:         Computes the assets attached to system object with idSystemObject = ID. If just one, downloads it alone.  If multiple, computes a zip and downloads that zip.
 * /download/idSystemObject-ID:         Computes the assets attached to system object with idSystemObject = ID. If just one, downloads it alone.  If multiple, computes a zip and downloads that zip.
 * /download/idSystemObject-ID/FOO/BAR: Computes the asset  attached to system object with idSystemObject = ID, found at the path /FOO/BAR.
 * /download?idSystemObjectVersion=ID:  Computes the assets attached to system object version with idSystemObjectVersion = ID. If just one, downloads it alone.  If multiple, computes a zip and downloads that zip.
 *
 * REPORTS:
 * /download?idWorkflow=ID:             Downloads the WorkflowReport(s) for the specified workflow ID
 * /download?idWorkflowReport=ID:       Downloads the specified WorkflowReport
 * /download?idWorkflowSet=ID:          Downloads the WorkflowReport(s) for workflows in the specified workflow set
 */
export async function download(request: Request, response: Response): Promise<boolean> {
    const DL: Downloader = new Downloader(request, response);
    try {
        return await DL.execute();
    } catch (error) {
        LOG.error('/download', LOG.LS.eHTTP, error);
        return false;
    }
}

enum eDownloadMode {
    eAssetVersion,
    eAsset,
    eSystemObject,
    eSystemObjectVersion,
    eWorkflow,
    eWorkflowReport,
    eWorkflowSet,
    eUnknown
}

class Downloader {
    private request: Request;
    private response: Response;

    private eMode: eDownloadMode = eDownloadMode.eUnknown;
    private idAssetVersion: number | null = null;
    private idAsset: number | null = null;
    private idSystemObject: number | null = null;
    private idSystemObjectVersion: number | null = null;

    private idWorkflow: number | null = null;
    private idWorkflowReport: number | null = null;
    private idWorkflowSet: number | null = null;

    private systemObjectPath: string | null = null;         // path of asset (e.g. /FOO/BAR) to be downloaded when accessed via e.g. /download/idSystemObject-ID/FOO/BAR

    private static regexDownload: RegExp = new RegExp('/download/idSystemObject-(\\d*)(/.*)?', 'i');

    constructor(request: Request, response: Response) {
        this.request = request;
        this.response = response;
    }

    async execute(): Promise<boolean> {
        if (!isAuthenticated(this.request)) {
            LOG.error('/download not authenticated', LOG.LS.eHTTP);
            return this.sendError(403);
        }

        if (!this.parseArguments())
            return false;

        switch (this.eMode) {
            case eDownloadMode.eAssetVersion: {
                const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(this.idAssetVersion!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                if (!assetVersion) {
                    LOG.error(`/download?idAssetVersion=${this.idAssetVersion} invalid parameter`, LOG.LS.eHTTP);
                    return this.sendError(404);
                }
                return this.emitDownload(assetVersion);
            }

            case eDownloadMode.eAsset: {
                const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(this.idAsset!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                if (!assetVersion) {
                    LOG.error(`/download?idAsset=${this.idAsset} unable to fetch asset version`, LOG.LS.eHTTP);
                    return this.sendError(404);
                }
                return await this.emitDownload(assetVersion);
            }

            case eDownloadMode.eSystemObject: {
                const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(this.idSystemObject!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                if (!assetVersions) {
                    LOG.error(`${this.reconstructSystemObjectLink()} unable to fetch asset versions`, LOG.LS.eHTTP);
                    return this.sendError(404);
                }
                if (assetVersions.length == 0) {
                    this.response.send(`No Assets are connected to idSystemObject ${this.idSystemObject}`);
                    return true;
                }

                // if we don't have a system object path, return the zip of all assets
                if (!this.systemObjectPath || this.systemObjectPath === '/')
                    return await this.emitDownloadZip(assetVersions);

                // otherwise, find the specified asset by path
                const pathToMatch: string = this.systemObjectPath.toLowerCase();
                let pathsConsidered: string = '\n';
                for (const assetVersion of assetVersions) {
                    const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
                    if (!asset) {
                        LOG.error(`${this.reconstructSystemObjectLink()} unable to fetch asset from assetVersion ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`, LOG.LS.eHTTP);
                        return this.sendError(404);
                    }
                    const pathAssetVersion: string = (((asset.FilePath !== '' && asset.FilePath !== '.') ? `/${asset.FilePath}` : '')
                        + `/${assetVersion.FileName}`).toLowerCase();
                    if (pathToMatch === pathAssetVersion)
                        return this.emitDownload(assetVersion);
                    else
                        pathsConsidered += `${pathAssetVersion}\n`;
                }

                LOG.error(`${this.reconstructSystemObjectLink()} unable to find assetVersion with path ${pathToMatch} from ${pathsConsidered}`, LOG.LS.eHTTP);
                return this.sendError(404);
            }

            case eDownloadMode.eSystemObjectVersion: {
                const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchFromSystemObjectVersion(this.idSystemObjectVersion!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                if (!assetVersions) {
                    LOG.error(`/download?idSystemObjectVersion=${this.idSystemObjectVersion} unable to fetch asset versions`, LOG.LS.eHTTP);
                    return this.sendError(404);
                }
                if (assetVersions.length == 0) {
                    this.response.send(`No Assets are connected to idSystemObjectVersion ${this.idSystemObjectVersion}`);
                    return true;
                }
                return await this.emitDownloadZip(assetVersions);
            }

            case eDownloadMode.eWorkflow: {
                const WFReports: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromWorkflow(this.idWorkflow!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                if (!WFReports || WFReports.length === 0) {
                    LOG.error(`/download?idWorkflow=${this.idWorkflow} invalid parameter`, LOG.LS.eHTTP);
                    return this.sendError(404);
                }
                return this.emitDownloadReports(WFReports);
            }

            case eDownloadMode.eWorkflowReport: {
                const WFReport: DBAPI.WorkflowReport | null = await DBAPI.WorkflowReport.fetch(this.idWorkflowReport!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                if (!WFReport) {
                    LOG.error(`/download?idWorkflowReport=${this.idWorkflowReport} invalid parameter`, LOG.LS.eHTTP);
                    return this.sendError(404);
                }
                return this.emitDownloadReports([WFReport]);
            }

            case eDownloadMode.eWorkflowSet: {
                const WFReports: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromWorkflowSet(this.idWorkflowSet!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                if (!WFReports || WFReports.length === 0) {
                    LOG.error(`/download?idWorkflowSet=${this.idWorkflowSet} invalid parameter`, LOG.LS.eHTTP);
                    return this.sendError(404);
                }
                return this.emitDownloadReports(WFReports);
            }
        }
        return this.sendError(404);
    }

    /** Returns false if arguments are invalid */
    private parseArguments(): boolean {
        // /download/idSystemObject-ID:         Computes the assets attached to this system object.  If just one, downloads it alone.  If multiple, computes a zip and downloads that zip.
        // /download/idSystemObject-ID/FOO/BAR: Computes the asset attached to this system object, found at the path /FOO/BAR.
        let idSystemObjectU: string | string[] | ParsedQs | ParsedQs[] | undefined = undefined;

        const downloadMatch: RegExpMatchArray | null = this.request.path.match(Downloader.regexDownload);
        if (downloadMatch && downloadMatch.length >= 2) {
            idSystemObjectU = downloadMatch[1];
            if (downloadMatch.length >= 3)
                this.systemObjectPath = downloadMatch[2];
        }

        if (!idSystemObjectU)
            idSystemObjectU = this.request.query.idSystemObject;
        const idSystemObjectVersionU = this.request.query.idSystemObjectVersion;
        const idAssetU = this.request.query.idAsset;
        const idAssetVersionU = this.request.query.idAssetVersion;
        const idWorkflowU = this.request.query.idWorkflow;
        const idWorkflowReportU = this.request.query.idWorkflowReport;
        const idWorkflowSetU = this.request.query.idWorkflowSet;

        const urlParamCount: number = (idSystemObjectU ? 1 : 0) + (idSystemObjectVersionU ? 1 : 0) + (idAssetU ? 1 : 0)
            + (idAssetVersionU ? 1 : 0) + (idWorkflowU ? 1 : 0) + (idWorkflowReportU ? 1 : 0) + (idWorkflowSetU ? 1 : 0);
        if (urlParamCount != 1) {
            LOG.error(`/download called with ${urlParamCount} parameters, expected 1`, LOG.LS.eHTTP);
            return this.sendError(404);
        }

        if (idAssetVersionU) {
            this.idAssetVersion = H.Helpers.safeNumber(idAssetVersionU);
            if (!this.idAssetVersion) {
                LOG.error(`/download?idAssetVersion=${idAssetVersionU}, invalid parameter`, LOG.LS.eHTTP);
                return this.sendError(404);
            }
            this.eMode = eDownloadMode.eAssetVersion;
        }

        if (idAssetU) {
            this.idAsset = H.Helpers.safeNumber(idAssetU);
            if (!this.idAsset) {
                LOG.error(`/download?idAsset=${idAssetU}, invalid parameter`, LOG.LS.eHTTP);
                return this.sendError(404);
            }
            this.eMode = eDownloadMode.eAsset;
        }

        if (idSystemObjectU) {
            this.idSystemObject = H.Helpers.safeNumber(idSystemObjectU);
            if (!this.idSystemObject) {
                LOG.error(`/download?idSystemObject=${idSystemObjectU} invalid parameter`, LOG.LS.eHTTP);
                return this.sendError(404);
            }
            this.eMode = eDownloadMode.eSystemObject;
        }

        if (idSystemObjectVersionU) {
            this.idSystemObjectVersion = H.Helpers.safeNumber(idSystemObjectVersionU);
            if (!this.idSystemObjectVersion) {
                LOG.error(`/download?idSystemObjectVersion=${idSystemObjectVersionU} invalid parameter`, LOG.LS.eHTTP);
                return this.sendError(404);
            }
            this.eMode = eDownloadMode.eSystemObjectVersion;
        }

        if (idWorkflowU) {
            this.idWorkflow = H.Helpers.safeNumber(idWorkflowU);
            if (!this.idWorkflow) {
                LOG.error(`/download?idWorkflow=${idWorkflowU} invalid parameter`, LOG.LS.eHTTP);
                return this.sendError(404);
            }
            this.eMode = eDownloadMode.eWorkflow;
        }

        if (idWorkflowReportU) {
            this.idWorkflowReport = H.Helpers.safeNumber(idWorkflowReportU);
            if (!this.idWorkflowReport) {
                LOG.error(`/download?idWorkflowReport=${idWorkflowReportU} invalid parameter`, LOG.LS.eHTTP);
                return this.sendError(404);
            }
            this.eMode = eDownloadMode.eWorkflowReport;
        }

        if (idWorkflowSetU) {
            this.idWorkflowSet = H.Helpers.safeNumber(idWorkflowSetU);
            if (!this.idWorkflowSet) {
                LOG.error(`/download?idWorkflowSet=${idWorkflowSetU} invalid parameter`, LOG.LS.eHTTP);
                return this.sendError(404);
            }
            this.eMode = eDownloadMode.eWorkflowSet;
        }
        return true;
    }

    private async emitDownload(assetVersion: DBAPI.AssetVersion): Promise<boolean> {
        const idAssetVersion: number = assetVersion.idAssetVersion;
        const res: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersion(assetVersion);
        if (!res.success || !res.readStream) {
            LOG.error(`download idAssetVersion=${idAssetVersion} unable to read from storage: ${res.error}`, LOG.LS.eHTTP);
            return this.sendError(500);
        }
        const fileName: string = assetVersion.FileName;
        const mimeType: string = mime.lookup(fileName) || 'application/octet-stream';
        return this.emitDownloadFromStream(res.readStream, fileName, mimeType);
    }

    private reconstructSystemObjectLink(): string {
        return (this.systemObjectPath) ? `/download/idSystemObject-${this.idSystemObject}${this.systemObjectPath}` :`/download?idSystemObject=${this.idSystemObject}`;
    }

    private async emitDownloadZip(assetVersions: DBAPI.AssetVersion[]): Promise<boolean> {
        let errorMsgBase: string = '';
        let idSystemObject: number = this.idSystemObject ?? 0;

        if (idSystemObject)
            errorMsgBase = this.reconstructSystemObjectLink();
        else if (this.idSystemObjectVersion) {
            errorMsgBase = `/download?idSystemObjectVersion=${this.idSystemObjectVersion}`;
            const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetch(this.idSystemObjectVersion);
            if (SOV)
                idSystemObject = SOV.idSystemObject;
            else {
                LOG.error(`${errorMsgBase} failed to laod SystemObjectVersion by id ${this.idSystemObjectVersion}`, LOG.LS.eHTTP);
                return false;
            }
        } else {
            LOG.error('/download emitDownloadZip called with unexpected parameters', LOG.LS.eHTTP);
            return false;
        }

        const zip: ZIP.ZipStream = new ZIP.ZipStream();
        for (const assetVersion of assetVersions) {
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
            if (!asset) {
                LOG.error(`${errorMsgBase} failed to identify asset by id ${assetVersion.idAsset}`, LOG.LS.eHTTP);
                return this.sendError(500);
            }

            const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(asset, assetVersion);
            if (!RSR.success || !RSR.readStream) {
                LOG.error(`${errorMsgBase} failed to extract stream for asset version ${assetVersion.idAssetVersion}`, LOG.LS.eHTTP);
                return this.sendError(500);
            }

            const fileNameAndPath: string = path.join(asset.FilePath, assetVersion.FileName);
            const res: H.IOResults = await zip.add(fileNameAndPath, RSR.readStream);
            if (!res.success) {
                LOG.error(`${errorMsgBase} failed to add asset version ${assetVersion.idAssetVersion} to zip: ${res.error}`, LOG.LS.eHTTP);
                return this.sendError(500);
            }
        }

        const zipStream: NodeJS.ReadableStream | null = await zip.streamContent(null);
        if (!zipStream) {
            LOG.error(`${errorMsgBase} failed to extract stream from zip`, LOG.LS.eHTTP);
            return this.sendError(500);
        }

        const fileName: string = (await CACHE.SystemObjectCache.getObjectNameByID(idSystemObject) || `SystemObject${idSystemObject}`) + '.zip';
        const mimeType: string = mime.lookup(fileName) || 'application/zip';
        return this.emitDownloadFromStream(zipStream, fileName, mimeType);
    }

    private async emitDownloadReports(WFReports: DBAPI.WorkflowReport[]): Promise<boolean> {
        if (WFReports.length === 0)
            return false;
        const mimeType: string = WFReports[0].MimeType;

        this.response.setHeader('Content-disposition', 'attachment; filename=WorkflowReport.htm');
        if (mimeType)
            this.response.setHeader('Content-type', mimeType);
        let first: boolean = true;
        for (const report of WFReports) {
            if (first)
                first = false;
            else
                this.response.write('<br/>\n<br/>\n');
            this.response.write(report.Data);
        }
        this.response.end();
        return true;
    }

    private async emitDownloadFromStream(readStream: NodeJS.ReadableStream, fileNameIn: string, mimeType: string | undefined): Promise<boolean> {
        const fileName: string = fileNameIn.replace(/,/g, '_'); // replace commas with underscores to avoid ERR_RESPONSE_HEADERS_MULTIPLE_CONTENT_DISPOSITION browser error
        if (!mimeType)
            mimeType = mime.lookup(fileName) || 'application/octet-stream';
        LOG.info(`/download emitDownloadFromStream filename=${fileName}, mimetype=${mimeType}`, LOG.LS.eHTTP);

        this.response.setHeader('Content-disposition', 'attachment; filename=' + fileName);
        if (mimeType)
            this.response.setHeader('Content-type', mimeType);
        readStream.pipe(this.response);
        return true;
    }


    private sendError(statusCode: number, message?: string | undefined): boolean {
        this.response.status(statusCode);
        this.response.send(message ?? '');
        return false;
    }
}