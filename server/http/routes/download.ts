import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import * as ZIP from '../../utils/zipStream';
import * as STORE from '../../storage/interface';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { eEventKey } from '../../event/interface/EventEnums';
import { DownloaderParser, DownloaderParserResults, eDownloadMode } from './DownloaderParser';
import { SitemapGenerator } from './SitemapGenerator';
import { isAuthenticated } from '../auth';

import { Request, Response } from 'express';
import * as mime from 'mime-types';
import path from 'path';

/** Used to provide download access to assets and reports. Access with one of the following URL patterns:
 * ASSETS:
 * /download?idAssetVersion=ID:                 Downloads the specified version of the specified asset
 * /download?idAsset=ID:                        Downloads the most recent asset version of the specified asset
 * /download?idSystemObject=ID:                 Computes the assets attached to system object with idSystemObject = ID. If just one, downloads it alone.  If multiple, computes a zip and downloads that zip.
 * /download/idSystemObject-ID:                 Computes the assets attached to system object with idSystemObject = ID. If just one, downloads it alone.  If multiple, computes a zip and downloads that zip.
 * /download/idSystemObject-ID/FOO/BAR:         Computes the asset  attached to system object with idSystemObject = ID, found at the path /FOO/BAR.
 * /download?idSystemObjectVersion=ID:          Computes the assets attached to system object version with idSystemObjectVersion = ID. If just one, downloads it alone.  If multiple, computes a zip and downloads that zip.
 *
 * METADATA:
 * /download?idMetadata=ID:                     Downloads the specified metadata, which may be text or an asset
 *
 * REPORTS:
 * /download?idWorkflow=ID:                     Downloads the WorkflowReport(s) for the specified workflow ID
 * /download?idWorkflowReport=ID:               Downloads the specified WorkflowReport
 * /download?idWorkflowSet=ID:                  Downloads the WorkflowReport(s) for workflows in the specified workflow set
 * /download?idJobRun=ID:                       Downloads the JobRun output for idJobRun with the specified ID
 * /download?idSystemObjectVersionComment=ID    Downloads the SystemObjectVersion.Comment for the SystemObjectVersion with the specified ID
 * /download/sitemap.xml                        Generates a sitemap
 */
export async function download(request: Request, response: Response): Promise<boolean> {
    const DL: Downloader = new Downloader(request, response);
    try {
        return await DL.execute();
    } catch (error) {
        LOG.error(Downloader.httpRoute, LOG.LS.eHTTP, error);
        return false;
    }
}

export class Downloader {
    private request: Request;
    private response: Response;
    private downloaderParser: DownloaderParser;

    static httpRoute: string = '/download';

    constructor(request: Request, response: Response) {
        this.request = request;
        this.response = response;
        this.downloaderParser = new DownloaderParser(Downloader.httpRoute, this.request.path, this.request.query);
    }

    async execute(): Promise<boolean> {
        if (!isAuthenticated(this.request)) {
            AuditFactory.audit({ url: this.request.path, auth: false }, { eObjectType: 0, idObject: 0 }, eEventKey.eHTTPDownload);
            LOG.error(`${Downloader.httpRoute} not authenticated`, LOG.LS.eHTTP);
            return this.sendError(403);
        }

        const DPResults: DownloaderParserResults = await this.downloaderParser.parseArguments();
        if (!DPResults.success)
            return this.sendError(DPResults.statusCode ?? 200, DPResults.message);

        // Audit download
        if (this.downloaderParser.eModeV !== eDownloadMode.eSitemap) {
            const auditData = { url: this.downloaderParser.requestURLV, auth: true };
            const auditOID: DBAPI.ObjectIDAndType = { eObjectType: this.downloaderParser.eObjectTypeV, idObject: this.downloaderParser.idObjectV };
            AuditFactory.audit(auditData, auditOID, eEventKey.eHTTPDownload);
        }

        if (DPResults.message) {
            this.response.send(DPResults.message);
            return true;
        }

        switch (this.downloaderParser.eModeV) {
            case eDownloadMode.eAssetVersion:
                return (DPResults.assetVersion) ? await this.emitDownload(DPResults.assetVersion) : this.sendError(404);

            case eDownloadMode.eAsset:
                return (DPResults.assetVersion)
                    ? await this.emitDownload(DPResults.assetVersion)
                    : this.sendError(404, `${Downloader.httpRoute}?idAsset=${this.downloaderParser.idAssetV} unable to fetch asset version`);

            case eDownloadMode.eSystemObject:
                if (DPResults.assetVersions)
                    return await this.emitDownloadZip(DPResults.assetVersions);
                else if (DPResults.assetVersion)
                    return await this.emitDownload(DPResults.assetVersion);
                else
                    return true;

            case eDownloadMode.eSystemObjectVersion:
                if (DPResults.assetVersions)
                    return await this.emitDownloadZip(DPResults.assetVersions);
                return true;

            case eDownloadMode.eMetadata:
                if (DPResults.content)
                    return await this.emitDownloadContent(DPResults.content, `MetadataContent.${this.downloaderParser.idMetadataV}.htm`);
                else if (DPResults.assetVersion)
                    return await this.emitDownload(DPResults.assetVersion);
                else
                    return this.sendError(404);

            case eDownloadMode.eWorkflow:
            case eDownloadMode.eWorkflowReport:
            case eDownloadMode.eWorkflowSet:
                return DPResults.WFReports ? await this.emitDownloadReports(DPResults.WFReports) : this.sendError(404);

            case eDownloadMode.eJobRun:
                return DPResults.jobRun ? await this.emitDownloadJobRun(DPResults.jobRun) : this.sendError(404);

            case eDownloadMode.eSystemObjectVersionComment:
                return (DPResults.content != null) ? await this.emitDownloadContent(DPResults.content, `VersionComment.${this.downloaderParser.idSystemObjectVersionCommentV}.htm`) : this.sendError(404);

            case eDownloadMode.eAssetVersionComment:
                return (DPResults.content != null) ? await this.emitDownloadContent(DPResults.content, `AssetVersionComment.${this.downloaderParser.idAssetVersionCommentV}.htm`) : this.sendError(404);

            case eDownloadMode.eSitemap:
                return await this.emitSitemapContent();
        }
        return this.sendError(404);
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

    private async emitDownloadZip(assetVersions: DBAPI.AssetVersion[]): Promise<boolean> {
        const errorMsgBase: string = this.downloaderParser.requestURLV;
        let idSystemObject: number = this.downloaderParser.idSystemObjectV ?? 0;

        if (this.downloaderParser.idSystemObjectVersionV) {
            const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetch(this.downloaderParser.idSystemObjectVersionV);
            if (SOV)
                idSystemObject = SOV.idSystemObject;
            else {
                LOG.error(`${errorMsgBase} failed to laod SystemObjectVersion by id ${this.downloaderParser.idSystemObjectVersionV}`, LOG.LS.eHTTP);
                return false;
            }
        } else if (!this.downloaderParser.idSystemObjectV) {
            LOG.error(`${Downloader.httpRoute} emitDownloadZip called with unexpected parameters`, LOG.LS.eHTTP);
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
                LOG.error(`${errorMsgBase} failed to extract stream for asset version ${assetVersion.idAssetVersion}: ${RSR.error}`, LOG.LS.eHTTP);
                return this.sendError(500);
            }

            const fileNameAndPath: string = path.posix.join(assetVersion.FilePath, assetVersion.FileName);
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
        const idWorkflowReport: number = WFReports[0].idWorkflowReport;

        this.response.setHeader('Content-disposition', `inline; filename=WorkflowReport.${idWorkflowReport}.htm`);
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

    private async emitDownloadJobRun(jobRun: DBAPI.JobRun): Promise<boolean> {
        this.response.setHeader('Content-disposition', `inline; filename=JobRun.${jobRun.idJobRun}.htm`);
        this.response.setHeader('Content-type', 'application/json');
        this.response.write(jobRun.Output ?? '');
        this.response.end();
        return true;
    }

    private async emitDownloadContent(content: string | null, filename: string | null): Promise<boolean> {
        this.response.setHeader('Content-disposition', `inline; filename=${filename ?? 'content.txt'}`);
        this.response.setHeader('Content-type', 'text/plain');
        this.response.write(content ?? '');
        this.response.end();
        return true;
    }

    private async emitDownloadFromStream(readStream: NodeJS.ReadableStream, fileNameIn: string, mimeType: string | undefined): Promise<boolean> {
        const fileName: string = fileNameIn.replace(/,/g, '_'); // replace commas with underscores to avoid ERR_RESPONSE_HEADERS_MULTIPLE_CONTENT_DISPOSITION browser error
        if (!mimeType)
            mimeType = mime.lookup(fileName) || 'application/octet-stream';
        LOG.info(`${Downloader.httpRoute} emitDownloadFromStream filename=${fileName}, mimetype=${mimeType}`, LOG.LS.eHTTP);

        this.response.setHeader('Content-disposition', 'attachment; filename=' + fileName);
        if (mimeType)
            this.response.setHeader('Content-type', mimeType);
        readStream.pipe(this.response);
        return true;
    }

    private async emitSitemapContent(): Promise<boolean> {
        this.response.setHeader('Content-type', 'application/xml');
        const ret: boolean = await SitemapGenerator.generate(this.response);
        this.response.end();
        return ret;
    }

    private sendError(statusCode: number, message?: string | undefined): boolean {
        this.response.status(statusCode);
        this.response.send(message ?? '');
        return false;
    }
}