import fetch from 'node-fetch';
import * as COL from '../interface';
import Config from '../../config';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

interface GetRequestResults {
    output: string;
    statusText: string;
    success: boolean;
}

class EdanCollection implements COL.ICollection {
    async queryCollection(query: string, rows: number, start: number): Promise<COL.CollectionQueryResults | null> {
        const records: COL.CollectionQueryResultRecord[] = [];
        const result: COL.CollectionQueryResults = {
            records,
            rowCount: 0,
            error: ''
        };

        const params: string                = `q=${escape(query)}&rows=${rows}&start=${start}`;
        const reqResult: GetRequestResults  = await this.sendGetRequest('metadata/v2.0/collections/search.htm', params);
        const jsonResult                    = reqResult.output ? JSON.parse(reqResult.output) : /* istanbul ignore next */ null;

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

                    records.push({ name, unit, identifierPublic, identifierCollection });
                }
            }
        }

        // LOG.logger.info(JSON.stringify(result) + '\n\n');
        // LOG.logger.info(reqResult.output + '\n\n');
        return result;
    }

    /**
     * Creates the header for the request to EDAN. Takes a uri, prepends a nonce, and appends
     * the date and appID key. Hashes as sha1() and base64_encode() the result.
     * @param uri The URI (string) to be hashed and encoded.
     * @returns Array containing all the header elements and signed header value
     */
    private encodeHeader(uri: string): [string, string][] {
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
        return headers;
    }

    /**
     * Perform an HTTP GET request
     * @param path The URL path
     * @param params The URL params, which specify the query details
     */
    private async sendGetRequest(path: string, params: string): Promise<GetRequestResults> {
        const url: string = Config.collection.edan.server + path + '?' + params;
        try {
            const res = await fetch(url, { headers: this.encodeHeader(params) });
            return {
                output: await res.text(),
                statusText: res.statusText,
                success: res.ok
            };
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('EdanCollection.sendGetRequest', error);
            return {
                output: JSON.stringify(error),
                statusText: 'node-fetch error',
                success: false
            };
        }
    }
}

export default EdanCollection;
