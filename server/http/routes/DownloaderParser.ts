import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COL from '../../collections/interface';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

import { ParsedQs, parse } from 'qs';

export enum eDownloadMode {
    eAssetVersion,
    eAsset,
    eSystemObject,
    eSystemObjectVersion,
    eWorkflow,
    eWorkflowReport,
    eWorkflowSet,
    eJobRun,
    eSystemObjectVersionComment,
    eMetadata,
    eSitemap,
    eUnknown
}

export interface DownloaderParserResults {
    success: boolean;
    statusCode?: number; // undefined means 200
    matchedPartialPath?: string; // when set, indicates the parser matched the specified partial path, typically for a system object that has subelements (such as a scene and its articles)
    message?: string; // when set, we ignore processing of items below
    assetVersion?: DBAPI.AssetVersion;
    assetVersions?: DBAPI.AssetVersion[];
    WFReports?: DBAPI.WorkflowReport[];
    jobRun?: DBAPI.JobRun;
    content?: string | null;
}

export class DownloaderParser {
    private eMode: eDownloadMode = eDownloadMode.eUnknown;
    private idAssetVersion: number | null = null;
    private idAsset: number | null = null;
    private idSystemObject: number | null = null;
    private idSystemObjectVersion: number | null = null;

    private idMetadata: number | null = null;

    private idWorkflow: number | null = null;
    private idWorkflowReport: number | null = null;
    private idWorkflowSet: number | null = null;
    private idJobRun: number | null = null;
    private idSystemObjectVersionComment: number | null = null;

    private systemObjectPath: string | null = null;                                             // path of asset (e.g. /FOO/BAR) to be downloaded when accessed via e.g. /download/idSystemObject-ID/FOO/BAR
    private fileMap: Map<string, DBAPI.AssetVersion> = new Map<string, DBAPI.AssetVersion>();   // Map of asset files path -> asset version

    private rootURL: string;
    private requestPath: string;
    private requestQuery?: ParsedQs;
    private regexDownload: RegExp;

    private requestURL: string = '';
    private eObjectType: DBAPI.eDBObjectType = DBAPI.eNonSystemObjectType.eUnknown;
    private idObject: number = 0;

    constructor(rootURL: string, requestPath: string, requestQuery?: ParsedQs) {
        this.rootURL = rootURL;
        this.requestPath = requestPath;
        this.requestQuery = requestQuery;
        this.regexDownload = new RegExp(`${rootURL}/idSystemObject-(\\d*)(/.*)?`, 'i');
    }

    get eModeV(): eDownloadMode { return this.eMode; }
    get idAssetVersionV(): number | null { return this.idAssetVersion; }
    get idAssetV(): number | null { return this.idAsset; }
    get idSystemObjectV(): number | null { return this.idSystemObject; }
    get idSystemObjectVersionV(): number | null { return this.idSystemObjectVersion; }

    get idMetadataV(): number | null { return this.idMetadata; }

    get idWorkflowV(): number | null { return this.idWorkflow; }
    get idWorkflowReportV(): number | null { return this.idWorkflowReport; }
    get idWorkflowSetV(): number | null { return this.idWorkflowSet; }
    get idJobRunV(): number | null { return this.idJobRun; }
    get idSystemObjectVersionCommentV(): number | null { return this.idSystemObjectVersionComment; }

    get systemObjectPathV(): string | null { return this.systemObjectPath; }
    get fileMapV(): Map<string, DBAPI.AssetVersion> { return this.fileMap; }

    get requestURLV(): string { return this.requestURL; }
    get eObjectTypeV(): DBAPI.eDBObjectType { return this.eObjectType; }
    get idObjectV(): number { return this.idObject; }

    /** Returns success: false if arguments are invalid */
    async parseArguments(allowUnmatchedPaths?: boolean, collectPaths?: boolean): Promise<DownloaderParserResults> {
        if (this.requestPath === '/download/sitemap.xml') {
            this.eMode = eDownloadMode.eSitemap;
            return { success: true };
        }

        // /download/idSystemObject-ID:         Computes the assets attached to this system object.  If just one, downloads it alone.  If multiple, computes a zip and downloads that zip.
        // /download/idSystemObject-ID/FOO/BAR: Computes the asset attached to this system object, found at the path /FOO/BAR.
        let idSystemObjectU: string | string[] | ParsedQs | ParsedQs[] | undefined = undefined;
        let matchedPartialPath: string | undefined = undefined;

        const downloadMatch: RegExpMatchArray | null = this.requestPath.match(this.regexDownload);
        if (downloadMatch && downloadMatch.length >= 2) {
            idSystemObjectU = downloadMatch[1];
            if (downloadMatch.length >= 3)
                this.systemObjectPath = downloadMatch[2];
        }

        if (!this.requestQuery)
            this.requestQuery = parse(this.requestPath);

        if (!idSystemObjectU)
            idSystemObjectU = this.requestQuery.idSystemObject;
        // LOG.info(`DownloadParser.parseArguments(${this.requestPath}), idSystemObjectU = ${idSystemObjectU}`, LOG.LS.eHTTP);

        const idAssetU = this.requestQuery.idAsset;
        const idAssetVersionU = this.requestQuery.idAssetVersion;
        const idSystemObjectVersionU = this.requestQuery.idSystemObjectVersion;

        const idMetadataU = this.requestQuery.idMetadata;

        const idWorkflowU = this.requestQuery.idWorkflow;
        const idWorkflowReportU = this.requestQuery.idWorkflowReport;
        const idWorkflowSetU = this.requestQuery.idWorkflowSet;
        const idJobRunU = this.requestQuery.idJobRun;
        const idSystemObjectVersionCommentU = this.requestQuery.idSystemObjectVersionComment;

        const urlParamCount: number = (idSystemObjectU ? 1 : 0) + (idSystemObjectVersionU ? 1 : 0)
            + (idAssetU ? 1 : 0) + (idAssetVersionU ? 1 : 0) + (idMetadataU ? 1 : 0)
            + (idWorkflowU ? 1 : 0) + (idWorkflowReportU ? 1 : 0) + (idWorkflowSetU ? 1 : 0)
            + (idJobRunU ? 1 : 0) + (idSystemObjectVersionCommentU ? 1 : 0);
        if (urlParamCount != 1) {
            LOG.error(`DownloadParser called with ${urlParamCount} parameters, expected 1`, LOG.LS.eHTTP);
            return this.recordStatus(404);
        }

        if (idAssetVersionU) {
            this.idAssetVersion = H.Helpers.safeNumber(idAssetVersionU);
            this.requestURL = `${this.rootURL}?idAssetVersion=${idAssetVersionU}`;
            if (!this.idAssetVersion) {
                LOG.error(`${this.requestURL}, invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eAssetVersion;
            this.eObjectType = DBAPI.eSystemObjectType.eAssetVersion;
            this.idObject = this.idAssetVersion;

            const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(this.idAssetVersion!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!assetVersion) {
                LOG.error(`${this.requestURL}, invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            return { success: true, assetVersion };
        }

        if (idAssetU) {
            this.idAsset = H.Helpers.safeNumber(idAssetU);
            this.requestURL = `${this.rootURL}?idAsset=${idAssetU}`;
            if (!this.idAsset) {
                LOG.error(`${this.requestURL}, invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eAsset;
            this.eObjectType = DBAPI.eSystemObjectType.eAsset;
            this.idObject = this.idAsset;

            const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(this.idAsset!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!assetVersion) {
                LOG.error(`${this.requestURL} unable to fetch asset version`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            return { success: true, assetVersion }; // this.emitDownload(assetVersion);
        }

        if (idSystemObjectU) {
            this.idSystemObject = H.Helpers.safeNumber(idSystemObjectU);
            this.requestURL = (this.systemObjectPath)
                ? `${this.rootURL}/idSystemObject-${idSystemObjectU}${this.systemObjectPath}`
                :`/download?idSystemObject=${idSystemObjectU}`;

            if (!this.idSystemObject) {
                LOG.error(`${this.requestURL} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eSystemObject;
            const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(this.idSystemObject);
            if (oID) {
                this.eObjectType    = oID.eObjectType;
                this.idObject       = oID.idObject;
            } else {
                this.eObjectType    = DBAPI.eNonSystemObjectType.eSystemObject;
                this.idObject       = this.idSystemObject;
            }

            const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(this.idSystemObject!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!assetVersions) {
                LOG.error(`${this.requestURL} unable to fetch asset versions`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            if (assetVersions.length == 0)
                return { success: true, message: `No Assets are connected to idSystemObject ${this.idSystemObject}` };

            // if we don't have a system object path, return the zip of all assets
            if (!this.systemObjectPath || this.systemObjectPath === '/')
                return { success: true, assetVersions }; // await this.emitDownloadZip(assetVersions);

            // otherwise, find the specified asset by path
            const pathToMatch: string = this.systemObjectPath.toLowerCase();
            let assetVersionMatch: DBAPI.AssetVersion | null = null;
            for (const assetVersion of assetVersions) {
                const pathAssetVersion: string = ((assetVersion.FilePath !== '' && assetVersion.FilePath !== '.') ? `/${assetVersion.FilePath}` : '') + `/${assetVersion.FileName}`;
                const pathAssetVersionNorm: string = pathAssetVersion.toLowerCase();
                if (pathToMatch === pathAssetVersionNorm) {
                    assetVersionMatch = assetVersion;
                    if (!collectPaths)
                        break;
                } else {
                    if (pathAssetVersionNorm.startsWith(pathToMatch))
                        matchedPartialPath = pathToMatch;
                }
                this.fileMap.set(pathAssetVersion, assetVersion);
            }

            if (assetVersionMatch) {
                this.eObjectType    = DBAPI.eSystemObjectType.eAssetVersion;
                this.idObject       = assetVersionMatch.idAssetVersion;
                return { success: true, assetVersion: assetVersionMatch };
            }

            if (!allowUnmatchedPaths) {
                LOG.error(`${this.requestURL} unable to find assetVersion with path ${pathToMatch}`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            } else {
                LOG.info(`${this.requestURL} unable to find assetVersion with path ${pathToMatch}`, LOG.LS.eHTTP);
                return { success: true, matchedPartialPath }; // this.emitDownload(assetVersion);
            }
        }

        if (idSystemObjectVersionU) {
            this.idSystemObjectVersion = H.Helpers.safeNumber(idSystemObjectVersionU);
            this.requestURL = `${this.rootURL}?idSystemObjectVersion=${idSystemObjectVersionU}`;
            if (!this.idSystemObjectVersion) {
                LOG.error(`${this.requestURL} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eSystemObjectVersion;
            this.eObjectType    = DBAPI.eNonSystemObjectType.eSystemObjectVersion;
            this.idObject       = this.idSystemObjectVersion;

            const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchFromSystemObjectVersion(this.idSystemObjectVersion!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!assetVersions) {
                LOG.error(`${this.requestURL} unable to fetch asset versions`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            if (assetVersions.length == 0)
                return { success: true, message: `No Assets are connected to idSystemObjectVersion ${this.idSystemObjectVersion}` };
            return { success: true, assetVersions }; // await this.emitDownloadZip(assetVersions);
        }

        if (idMetadataU) {
            this.idMetadata = H.Helpers.safeNumber(idMetadataU);
            this.requestURL = `${this.rootURL}?idMetadata=${idMetadataU}`;
            if (!this.idMetadata) {
                LOG.error(`${this.requestURL} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eMetadata;
            this.eObjectType    = DBAPI.eNonSystemObjectType.eMetadata;
            this.idObject       = this.idMetadata;

            const metadata: DBAPI.Metadata | null = await DBAPI.Metadata.fetch(this.idMetadata!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!metadata) {
                LOG.error(`${this.requestURL} unable to fetch metadata`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }

            const value: string | null = metadata.ValueShort ?? metadata.ValueExtended;
            if (value) {
                const { label, content } = COL.parseEdanMetadata(value);
                const seperator: string = metadata.ValueExtended || label ? '\n' : ' = ';
                const labelPrefix: string = label ? `Label = ${label}\nValue = ` : '';
                return { success: true, content: `${metadata.Name}${seperator}${labelPrefix}${content}` };
            } else if (metadata.idAssetVersionValue) {
                const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(metadata.idAssetVersionValue);
                if (!assetVersion) {
                    LOG.error(`${this.requestURL} unable to fetch asset version`, LOG.LS.eHTTP);
                    return this.recordStatus(404);
                }
                return { success: true, assetVersion };
            }

            LOG.error(`${this.requestURL} called without metadata value`, LOG.LS.eHTTP);
            return this.recordStatus(404);
        }

        if (idWorkflowU) {
            this.idWorkflow = H.Helpers.safeNumber(idWorkflowU);
            this.requestURL = `${this.rootURL}?idWorkflow=${idWorkflowU}`;
            if (!this.idWorkflow) {
                LOG.error(`${this.requestURL} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eWorkflow;
            this.eObjectType    = DBAPI.eNonSystemObjectType.eWorkflow;
            this.idObject       = this.idWorkflow;

            const WFReports: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromWorkflow(this.idWorkflow!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!WFReports || WFReports.length === 0) {
                LOG.error(`${this.requestURL} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            return { success: true, WFReports }; // this.emitDownloadReports(WFReports);
        }

        if (idWorkflowReportU) {
            this.idWorkflowReport = H.Helpers.safeNumber(idWorkflowReportU);
            this.requestURL = `${this.rootURL}?idWorkflowReport=${idWorkflowReportU}`;
            if (!this.idWorkflowReport) {
                LOG.error(`${this.requestURL} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eWorkflowReport;
            this.eObjectType    = DBAPI.eNonSystemObjectType.eWorkflowReport;
            this.idObject       = this.idWorkflowReport;

            const WFReport: DBAPI.WorkflowReport | null = await DBAPI.WorkflowReport.fetch(this.idWorkflowReport!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!WFReport) {
                LOG.error(`${this.requestURL} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            return { success: true, WFReports: [WFReport] }; // this.emitDownloadReports([WFReport]);
        }

        if (idWorkflowSetU) {
            this.idWorkflowSet = H.Helpers.safeNumber(idWorkflowSetU);
            this.requestURL = `${this.rootURL}?idWorkflowSet=${idWorkflowSetU}`;
            if (!this.idWorkflowSet) {
                LOG.error(`${this.requestURL} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eWorkflowSet;
            this.eObjectType    = DBAPI.eNonSystemObjectType.eWorkflowSet;
            this.idObject       = this.idWorkflowSet;

            const WFReports: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromWorkflowSet(this.idWorkflowSet!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!WFReports || WFReports.length === 0) {
                LOG.error(`${this.requestURL} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            return { success: true, WFReports }; // this.emitDownloadReports(WFReports);
        }

        if (idJobRunU) {
            this.idJobRun = H.Helpers.safeNumber(idJobRunU);
            this.requestURL = `${this.rootURL}?idJobRun=${idJobRunU}`;
            if (!this.idJobRun) {
                LOG.error(`${this.requestURL} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eJobRun;
            this.eObjectType    = DBAPI.eNonSystemObjectType.eJobRun;
            this.idObject       = this.idJobRun;

            const jobRun: DBAPI.JobRun | null = await DBAPI.JobRun.fetch(this.idJobRun!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!jobRun) {
                LOG.error(`${this.requestURL} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            return { success: true, jobRun }; // this.emitDownloadJobRun(jobRun);
        }

        if (idSystemObjectVersionCommentU) {
            this.idSystemObjectVersionComment = H.Helpers.safeNumber(idSystemObjectVersionCommentU);
            this.requestURL = `${this.rootURL}?idSystemObjectVersionComment=${idSystemObjectVersionCommentU}`;
            if (!this.idSystemObjectVersionComment) {
                LOG.error(`${this.requestURL} invalid parameter`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            this.eMode = eDownloadMode.eSystemObjectVersionComment;
            this.eObjectType    = DBAPI.eNonSystemObjectType.eSystemObjectVersion;
            this.idObject       = this.idSystemObjectVersionComment;

            const systemObjectVersion: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetch(this.idSystemObjectVersionComment!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (!systemObjectVersion) {
                LOG.error(`${this.requestURL} unable to fetch system object version`, LOG.LS.eHTTP);
                return this.recordStatus(404);
            }
            return { success: true, content: systemObjectVersion.Comment };
        }

        return this.recordStatus(404);
    }

    private recordStatus(statusCode: number, message?: string | undefined): DownloaderParserResults {
        return { success: false, statusCode, message };
    }
}
