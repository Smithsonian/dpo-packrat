/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import fetch, { RequestInit } from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import * as COL from '../interface';
import { PublishScene } from './PublishScene';
import { PublishSubject } from './PublishSubject';
import { Config } from '../../config';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import * as COMMON from '@dpo-packrat/common';
import { EdanLicenseInfo } from '../interface';

interface HttpRequestResult {
    output: string;
    statusText: string;
    success: boolean;
}

const NAME_MAPPING_AUTHORITY: string = 'http://n2t.net/';
const NAME_ASSIGNING_AUTHORITY: string = '65665';
const DEFAULT_ARK_SHOULDER: string = 'p2b'; // TODO: replace with real value

enum eAPIType {
    eEDAN = 1,
    eEDAN3dApi = 2,
}

enum eHTTPMethod {
    eGet = 1,
    ePost = 2,
}

export class EdanCollection implements COL.ICollection {
    async queryCollection(query: string, rows: number, start: number, options: COL.CollectionQueryOptions | null): Promise<COL.CollectionQueryResults | null> {
        const records: COL.CollectionQueryResultRecord[] = [];
        const result: COL.CollectionQueryResults = {
            records,
            rowCount: 0,
        };

        let gatherRaw: boolean | undefined = false;
        let path: string = 'metadata/v2.0/collections/search.htm';
        let filter: string = '';
        const filters: string[] = [];
        if (options) {
            if (options.searchMetadata)
                path = 'metadata/v2.0/metadata/search.htm';
            if (options.recordType)
                filters.push(`type:${options.recordType}`);
            if (filters.length > 0) {
                filter = '&fq[]=';
                for (let filterIndex = 0; filterIndex < filters.length; filterIndex++)
                    filter = filter + (filterIndex == 0 ? '' : /* istanbul ignore next */ ',') + filters[filterIndex];
            }
            gatherRaw = options.gatherRaw ?? false;
        }

        const params: string                = `q=${encodeURIComponent(query)}${filter}&rows=${rows}&start=${start}`;
        const reqResult: HttpRequestResult  = await this.sendRequest(eAPIType.eEDAN, eHTTPMethod.eGet, path, params);
        let jsonResult: any | null          = null;
        try {
            jsonResult                      = reqResult.output ? JSON.parse(reqResult.output) : /* istanbul ignore next */ null;
        } catch (error) /* istanbul ignore next */ {
            LOG.error(`EdanCollection.queryCollection ${query}`, LOG.LS.eCOLL, error);
            jsonResult                      = null;
        }

        // jsonResult.rows -- array of { ..., title, id, unitCode, ..., content };
        // content.descriptiveNonRepeating.title.content = name
        // content.descriptiveNonRepeating.record_ID = EDAN ID
        // content.descriptiveNonRepeating.unit_code = Unit
        // content.descriptiveNonRepeating.guid = ID
        /* istanbul ignore else */
        if (jsonResult) {
            /* istanbul ignore else */
            if (jsonResult.rowCount)
                result.rowCount = jsonResult.rowCount;

            /* istanbul ignore else */
            if (jsonResult.rows) {
                for (const row of jsonResult.rows) {
                    let name = row.title ? row.title : /* istanbul ignore next */ '';
                    let unit = row.unitCode ? row.unitCode : /* istanbul ignore next */ '';
                    let identifierPublic = row.id ? row.id : /* istanbul ignore next */ '';
                    let identifierCollection = row.id ? row.id : /* istanbul ignore next */ '';

                    /* istanbul ignore else */
                    if (row.content && row.content.descriptiveNonRepeating) {
                        const description = row.content.descriptiveNonRepeating;
                        /* istanbul ignore else */
                        if (description.title && description.title.content)
                            name = description.title.content;
                        /* istanbul ignore else */
                        if (description.unit_code)
                            unit = description.unit_code;
                        /* istanbul ignore else */
                        if (description.record_ID)
                            identifierCollection = description.record_ID;
                        /* istanbul ignore else */
                        if (description.guid)
                            identifierPublic = description.guid;
                    }

                    records.push({ name, unit, identifierPublic, identifierCollection, raw: gatherRaw ? row : undefined });
                }
            }
        }

        // LOG.info(JSON.stringify(result) + '\n\n', LOG.LS.eCOLL);
        // LOG.info(reqResult.output + '\n\n', LOG.LS.eCOLL);
        return result;
    }

    async publish(idSystemObject: number, ePublishState: number): Promise<boolean> {
        switch (ePublishState) {
            case COMMON.ePublishedState.eNotPublished:
            case COMMON.ePublishedState.eAPIOnly:
            case COMMON.ePublishedState.ePublished:
                break;
            default:
                LOG.error(`EdanCollection.publish called with invalid ePublishState ${ePublishState} for idSystemObject ${idSystemObject}`, LOG.LS.eCOLL);
                return false;
        }

        const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
        if (!oID) {
            LOG.error(`EdanCollection.publish(${idSystemObject}) unable to compute object id and type`, LOG.LS.eCOLL);
            return false;
        }

        switch (oID.eObjectType) {
            case COMMON.eSystemObjectType.eScene: {
                const PS: PublishScene = new PublishScene(idSystemObject);
                return PS.publish(this, ePublishState);
            }
            case COMMON.eSystemObjectType.eSubject: {
                const PS: PublishSubject = new PublishSubject(idSystemObject);
                const PSRes: H.IOResults = await PS.publish(this);
                return PSRes.success;
            }
        }
        return false;
    }

    async createEdanMDM(edanmdm: COL.EdanMDMContent, status: number, publicSearch: boolean): Promise<COL.EdanRecord | null> {
        const body: any = {
            url: `edanmdm:${edanmdm.descriptiveNonRepeating.record_ID}`,
            status,
            publicSearch,
            type: 'edanmdm',
            content: edanmdm,
        };
        return this.upsertContent(body, 'createEdanMDM');
    }

    async createEdan3DPackage(path: string, sceneFile?: string | undefined): Promise<COL.EdanRecord | null> {
        const body: any = sceneFile ? { resource: path, document: sceneFile } : { resource: path };
        return this.upsertResource(body, 'createEdan3DPackage');
    }

    async updateEdan3DPackage(url: string, title: string | undefined, sceneContent: COL.Edan3DPackageContent,
        status: number, publicSearch: boolean): Promise<COL.EdanRecord | null> {
        const body: any = {
            url,
            title,
            status,
            publicSearch,
            type: '3d_package',
            content: sceneContent,
        };
        return this.upsertContent(body, 'updateEdan3DPackage');
    }


    /** c.f. http://dev.3d.api.si.edu/apidocs/#api-admin-upsertContent */
    private async upsertContent(body: any, caller: string): Promise<COL.EdanRecord | null> {
        // LOG.info(`EdanCollection.upsertContent: ${JSON.stringify(body)}`, LOG.LS.eCOLL);
        LOG.info('EdanCollection.upsertContent', LOG.LS.eCOLL);
        const reqResult: HttpRequestResult = await this.sendRequest(eAPIType.eEDAN3dApi, eHTTPMethod.ePost, 'api/v1.0/admin/upsertContent', '', JSON.stringify(body), 'application/json');
        // LOG.info(`EdanCollection.upsertContent:\n${JSON.stringify(body)}\n${reqResult.output}`, LOG.LS.eCOLL);
        if (!reqResult.success) {
            LOG.error(`EdanCollection.${caller} failed with ${reqResult.statusText}: ${reqResult.output}`, LOG.LS.eCOLL);
            return null;
        }

        try {
            return JSON.parse(reqResult.output)?.response ?? null;
        } catch (error) {
            LOG.error(`EdanCollection.${caller} parse error: ${JSON.stringify(reqResult)}`, LOG.LS.eCOLL, error);
            return null;
        }
    }

    /** c.f. http://dev.3d.api.si.edu/apidocs/#api-admin-upsertResource */
    private async upsertResource(body: any, caller: string): Promise<COL.EdanRecord | null> {
        LOG.info(`EdanCollection.upsertResource: ${JSON.stringify(body)}`, LOG.LS.eCOLL);
        const reqResult: HttpRequestResult = await this.sendRequest(eAPIType.eEDAN3dApi, eHTTPMethod.ePost, 'api/v1.0/admin/upsertResource', '', JSON.stringify(body), 'application/json');
        // LOG.info(`EdanCollection.upsertResource:\n${JSON.stringify(body)}:\n${reqResult.output}`, LOG.LS.eCOLL);
        if (!reqResult.success) {
            LOG.error(`EdanCollection.${caller} failed with ${reqResult.statusText}: ${reqResult.output}`, LOG.LS.eCOLL);
            return null;
        }

        try {
            return JSON.parse(reqResult.output)?.response ?? null;
        } catch (error) {
            LOG.error(`EdanCollection.${caller} parse error: ${JSON.stringify(reqResult)}`, LOG.LS.eCOLL, error);
            return null;
        }
    }

    // #region Identifier services
    /** c.f. https://ezid.cdlib.org/learn/id_concepts
     * prefix typically comes from the collecting unit or from the scanning organization (SI DPO);
     * specify true for prependNameAuthority to create an identifier which is a URL
     */
    generateArk(prefix: string | null, prependNameAuthority: boolean): string {
        if (!prefix)
            prefix = DEFAULT_ARK_SHOULDER;
        const arkId: string = `ark:/${NAME_ASSIGNING_AUTHORITY}/${prefix}${uuidv4()}`;
        return prependNameAuthority ? this.transformArkIntoUrl(arkId) : arkId;
    }

    extractArkFromUrl(url: string): string | null {
        const arkPosition: number = url.indexOf('ark:');
        return (arkPosition > -1) ? url.substring(arkPosition) : null;
    }

    transformArkIntoUrl(arkId: string): string {
        return NAME_MAPPING_AUTHORITY + arkId;
    }

    getArkNameMappingAuthority(): string {
        return NAME_MAPPING_AUTHORITY;
    }

    getArkNameAssigningAuthority(): string {
        return NAME_ASSIGNING_AUTHORITY;
    }
    // #endregion

    // #region HTTP Helpers
    /**
     * Creates the header for the request to EDAN. Takes a uri, prepends a nonce, and appends
     * the date and appID key. Hashes as sha1() and base64_encode() the result.
     * @param uri The URI (string) to be hashed and encoded.
     * @returns Array containing all the header elements and signed header value
     */
    private encodeHeader(uri: string, contentType?: string | undefined): [string, string][] {
        const headers: [string, string][]   = [];
        const ipnonce: string               = (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)).substring(0, 15);
        const dtNow: Date                   = new Date();
        let   dateString                    = new Date(dtNow.getTime() - (dtNow.getTimezoneOffset() * 60000)).toISOString();
        dateString                          = dateString.substring(0, dateString.length - 5).replace('T', ' '); // trim off final ".333Z"; replace "T" with " "
        const auth: string                  = `${ipnonce}\n${uri}\n${dateString}\n${Config.collection.edan.authKey}`;

        const hash: string                  = H.Helpers.computeHashFromString(auth, 'sha1');
        const authContent: string           = Buffer.from(hash).toString('base64'); // seems like a bug to base64 encode hex output, but that does the trick!

        headers.push(['X-AppId', Config.collection.edan.appId]);
        headers.push(['X-RequestDate', dateString]);
        headers.push(['X-AppVersion', 'Packrat-' + process.env.npm_package_version]);
        headers.push(['X-Nonce', ipnonce]);
        headers.push(['X-AuthContent', authContent]);
        if (contentType !== undefined)
            headers.push(['Content-Type', contentType]);
        return headers;
    }

    /**
     * Perform an HTTP GET request
     * @param path The URL path
     * @param params The URL params, which specify the query details
     */
    private async sendRequest(eType: eAPIType, eMethod: eHTTPMethod, path: string, params: string,
        body?: string | undefined, contentType?: string | undefined): Promise<HttpRequestResult> {

        let method: string = 'GET';
        switch (eMethod) {
            default:
            case undefined:
            case eHTTPMethod.eGet: method = 'GET'; break;
            case eHTTPMethod.ePost: method = 'POST'; break;
        }

        let server: string = Config.collection.edan.server;
        switch (eType) {
            default:
            case undefined:
            case eAPIType.eEDAN:  server = Config.collection.edan.server; break;
            case eAPIType.eEDAN3dApi: server = Config.collection.edan.api3d; break;
        }

        const url: string = `${server}${path}${params ? '?' + params : ''}`;
        try {
            // LOG.info(`EdanCollection.sendRequest: ${url}, ${body}`, LOG.LS.eCOLL);
            LOG.info(`EdanCollection.sendRequest: ${url}`, LOG.LS.eCOLL);
            const init: RequestInit = { method, body: body ?? undefined, headers: this.encodeHeader(params, contentType) };
            const res = await fetch(url, init);
            return {
                output: await res.text(),
                statusText: res.statusText,
                success: res.ok
            };
        } catch (error) /* istanbul ignore next */ {
            LOG.error('EdanCollection.sendRequest', LOG.LS.eCOLL, error);
            return {
                output: JSON.stringify(error),
                statusText: 'node-fetch error',
                success: false
            };
        }
    }

    static computeLicenseInfo(licenseText?: string | undefined, licenseCodes?: string | undefined, usageText?: string | undefined): EdanLicenseInfo {
        const access: string = (licenseText && licenseText.toLowerCase() === 'cc0, publishable w/ downloads') ? 'CC0' : 'Usage conditions apply';
        return {
            access,
            codes: licenseCodes ?? '',
            text: usageText ?? '',
        };
    }
    // #endregion
}
