import * as DBAPI from '../../db';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

import { ParsedQs } from 'qs';

export enum eDownloadMode {
    eAssetVersion,
    eAsset,
    eSystemObject,
    eSystemObjectVersion,
    eWorkflow,
    eWorkflowReport,
    eWorkflowSet,
    eJobRun,
    eUnknown
}

export interface DownloaderParserResults {
    success: boolean;
    statusCode?: number; // undefined means 200
    message?: string; // when set, we ignore processing of items below
    assetVersion?: DBAPI.AssetVersion;
    assetVersions?: DBAPI.AssetVersion[];
    WFReports?: DBAPI.WorkflowReport[];
    jobRun?: DBAPI.JobRun;
}

export class DownloaderParser {
    eMode: eDownloadMode = eDownloadMode.eUnknown;
    idAssetVersion: number | null = null;
    idAsset: number | null = null;
    idSystemObject: number | null = null;
    idSystemObjectVersion: number | null = null;

    idWorkflow: number | null = null;
    idWorkflowReport: number | null = null;
    idWorkflowSet: number | null = null;
    idJobRun: number | null = null;

    systemObjectPath: string | null = null;         // path of asset (e.g. /FOO/BAR) to be downloaded when accessed via e.g. /download/idSystemObject-ID/FOO/BAR

    private rootURL: string;
    private requestPath: string;
    private requestQuery: ParsedQs;
    private static regexDownload: RegExp = new RegExp('/download/idSystemObject-(\\d*)(/.*)?', 'i');

    constructor(rootURL: string, requestPath: string, requestQuery: ParsedQs) {
        this.rootURL = rootURL;
        this.requestPath = requestPath;
        this.requestQuery = requestQuery;
    }

    /** Returns success: false if arguments are invalid */
    async parseArguments(): Promise<DownloaderParserResults> {
        // /download/idSystemObject-ID:         Computes the assets attached to this system object.  If just one, downloads it alone.  If multiple, computes a zip and downloads that zip.
        // /download/idSystemObject-ID/FOO/BAR: Computes the asset attached to this system object, found at the path /FOO/BAR.
        let idSystemObjectU: string | string[] | ParsedQs | ParsedQs[] | undefined = undefined;

        const downloadMatch: RegExpMatchArray | null = this.requestPath.match(DownloaderParser.regexDownload);
        if (downloadMatch && downloadMatch.length >= 2) {
            idSystemObjectU = downloadMatch[1];
            if (downloadMatch.length >= 3)
                this.systemObjectPath = downloadMatch[2];
        }

        if (!idSystemObjectU)
            idSystemObjectU = this.requestQuery.idSystemObject;
        const idSystemObjectVersionU = this.requestQuery.idSystemObjectVersion;
        const idAssetU = this.requestQuery.idAsset;
        const idAssetVersionU = this.requestQuery.idAssetVersion;
        const idWorkflowU = this.requestQuery.idWorkflow;
        const idWorkflowReportU = this.requestQuery.idWorkflowReport;
        const idWorkflowSetU = this.requestQuery.idWorkflowSet;
        const idJobRunU = this.requestQuery.idJobRun;

        const urlParamCount: number = (idSystemObjectU ? 1 : 0) + (idSystemObjectVersionU ? 1 : 0) + (idAssetU ? 1 : 0)
            + (idAssetVersionU ? 1 : 0) + (idWorkflowU ? 1 : 0) + (idWorkflowReportU ? 1 : 0) + (idWorkflowSetU ? 1 : 0)
            + (idJobRunU ? 1 : 0);
        if (urlParamCount != 1) {
            LOG.error(`${this.rootURL} called with ${urlParamCount} parameters, expected 1`, LOG.LS.eHTTP);
            return this.recordStatus(404);
        }

        if (idAssetVersionU) {
            this.idAssetVersion = H.Helpers.safeNumber(idAssetVersionU);
            if (!this.idAssetVersion) {
                LOG.error(`${this.rootURL}?idAssetVersion=${idAssetVersionU}, invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eAssetVersion;

            const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(this.idAssetVersion!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!assetVersion) {
                LOG.error(`${this.rootURL}?idAssetVersion=${this.idAssetVersion} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            return { success: true, assetVersion };
        }

        if (idAssetU) {
            this.idAsset = H.Helpers.safeNumber(idAssetU);
            if (!this.idAsset) {
                LOG.error(`${this.rootURL}?idAsset=${idAssetU}, invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eAsset;

            const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(this.idAsset!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!assetVersion) {
                LOG.error(`${this.rootURL}?idAsset=${this.idAsset} unable to fetch asset version`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            return { success: true, assetVersion }; // this.emitDownload(assetVersion);
        }

        if (idSystemObjectU) {
            this.idSystemObject = H.Helpers.safeNumber(idSystemObjectU);
            if (!this.idSystemObject) {
                LOG.error(`${this.rootURL}?idSystemObject=${idSystemObjectU} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eSystemObject;

            const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(this.idSystemObject!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!assetVersions) {
                LOG.error(`${this.reconstructSystemObjectLink()} unable to fetch asset versions`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            if (assetVersions.length == 0)
                return { success: true, message: `No Assets are connected to idSystemObject ${this.idSystemObject}` };

            // if we don't have a system object path, return the zip of all assets
            if (!this.systemObjectPath || this.systemObjectPath === '/')
                return { success: true, assetVersions }; // await this.emitDownloadZip(assetVersions);

            // otherwise, find the specified asset by path
            const pathToMatch: string = this.systemObjectPath.toLowerCase();
            let pathsConsidered: string = '\n';
            for (const assetVersion of assetVersions) {
                const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
                if (!asset) {
                    LOG.error(`${this.reconstructSystemObjectLink()} unable to fetch asset from assetVersion ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`, LOG.LS.eHTTP);
                    return this.recordStatus(404);
                }
                const pathAssetVersion: string = (((asset.FilePath !== '' && asset.FilePath !== '.') ? `/${asset.FilePath}` : '')
                    + `/${assetVersion.FileName}`).toLowerCase();
                if (pathToMatch === pathAssetVersion)
                    return { success: true, assetVersion }; // this.emitDownload(assetVersion);
                else
                    pathsConsidered += `${pathAssetVersion}\n`;
            }

            LOG.error(`${this.reconstructSystemObjectLink()} unable to find assetVersion with path ${pathToMatch} from ${pathsConsidered}`, LOG.LS.eHTTP);
            return this.recordStatus(404);
        }

        if (idSystemObjectVersionU) {
            this.idSystemObjectVersion = H.Helpers.safeNumber(idSystemObjectVersionU);
            if (!this.idSystemObjectVersion) {
                LOG.error(`${this.rootURL}?idSystemObjectVersion=${idSystemObjectVersionU} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eSystemObjectVersion;

            const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchFromSystemObjectVersion(this.idSystemObjectVersion!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!assetVersions) {
                LOG.error(`${this.rootURL}?idSystemObjectVersion=${this.idSystemObjectVersion} unable to fetch asset versions`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            if (assetVersions.length == 0)
                return { success: true, message: `No Assets are connected to idSystemObjectVersion ${this.idSystemObjectVersion}` };
            return { success: true, assetVersions }; // await this.emitDownloadZip(assetVersions);
        }

        if (idWorkflowU) {
            this.idWorkflow = H.Helpers.safeNumber(idWorkflowU);
            if (!this.idWorkflow) {
                LOG.error(`${this.rootURL}?idWorkflow=${idWorkflowU} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eWorkflow;

            const WFReports: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromWorkflow(this.idWorkflow!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!WFReports || WFReports.length === 0) {
                LOG.error(`${this.rootURL}?idWorkflow=${this.idWorkflow} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            return { success: true, WFReports }; // this.emitDownloadReports(WFReports);
        }

        if (idWorkflowReportU) {
            this.idWorkflowReport = H.Helpers.safeNumber(idWorkflowReportU);
            if (!this.idWorkflowReport) {
                LOG.error(`${this.rootURL}?idWorkflowReport=${idWorkflowReportU} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eWorkflowReport;

            const WFReport: DBAPI.WorkflowReport | null = await DBAPI.WorkflowReport.fetch(this.idWorkflowReport!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!WFReport) {
                LOG.error(`${this.rootURL}?idWorkflowReport=${this.idWorkflowReport} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            return { success: true, WFReports: [WFReport] }; // this.emitDownloadReports([WFReport]);
        }

        if (idWorkflowSetU) {
            this.idWorkflowSet = H.Helpers.safeNumber(idWorkflowSetU);
            if (!this.idWorkflowSet) {
                LOG.error(`${this.rootURL}?idWorkflowSet=${idWorkflowSetU} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eWorkflowSet;

            const WFReports: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromWorkflowSet(this.idWorkflowSet!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!WFReports || WFReports.length === 0) {
                LOG.error(`${this.rootURL}?idWorkflowSet=${this.idWorkflowSet} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            return { success: true, WFReports }; // this.emitDownloadReports(WFReports);
        }

        if (idJobRunU) {
            this.idJobRun = H.Helpers.safeNumber(idJobRunU);
            if (!this.idJobRun) {
                LOG.error(`${this.rootURL}?idJobRun=${idJobRunU} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eJobRun;

            const jobRun: DBAPI.JobRun | null = await DBAPI.JobRun.fetch(this.idJobRun!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!jobRun) {
                LOG.error(`${this.rootURL}?idJobRun=${this.idJobRun} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            return { success: true, jobRun }; // this.emitDownloadJobRun(jobRun);
        }
        return this.recordStatus(404);
    }

    private recordStatus(statusCode: number, message?: string | undefined): DownloaderParserResults {
        return { success: false, statusCode, message };
    }

    reconstructSystemObjectLink(): string {
        return (this.systemObjectPath) ? `/${this.rootURL}/idSystemObject-${this.idSystemObject}${this.systemObjectPath}` :`/download?idSystemObject=${this.idSystemObject}`;
    }
}
