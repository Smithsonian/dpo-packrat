/* eslint-disable @typescript-eslint/no-explicit-any */
import solr from 'solr-client';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';

export enum eSolrCore {
    ePackrat,
    ePackratMeta,
}

export class SolrClient {
    _client: solr.Client;
    private _host: string;
    private _port: number;
    private _core: string;

    constructor(host: string | null, port: number | null, eCore: eSolrCore | null) {
        if (!host) {
            const { PACKRAT_SOLR_HOST } = process.env;
            host = PACKRAT_SOLR_HOST || 'packrat-solr';
        }
        if (!port)
            port = 8983;

        let core: string | null = null;
        switch (eCore) {
            default:
            case eSolrCore.ePackrat: core = 'packrat'; break;
            case eSolrCore.ePackratMeta: core = 'packratMeta'; break;
        }

        this._host = host;
        this._port = port;
        this._core = core;
        this._client = solr.createClient({ host, port, core });
    }

    solrUrl(): string {
        return `http://${this._host}:${this._port}/solr/${this._core}`;
    }

    core(): string {
        return this._core;
    }

    async add(docs: any[]): Promise<H.IOResults> {
        try {
            return new Promise<H.IOResults>((resolve) => {
                this._client.add(docs, undefined, function (err, _obj) {
                    if (err) {
                        const error: string = `SolrClient.add failed: ${JSON.stringify(err)}`;
                        LOG.error(error, LOG.LS.eNAV);
                        resolve({ success: false, error });
                    } else
                        resolve({ success: true });
                });
            });
        } catch (err) /* istanbul ignore next */ {
            const error: string = `SolrClient.add failed: ${JSON.stringify(err)}`;
            LOG.error(error, LOG.LS.eNAV);
            return { success: false, error };
        }
    }

    async commit(): Promise<H.IOResults> {
        try {
            return new Promise<H.IOResults>((resolve) => {
                this._client.commit(undefined, function (err, _obj) {
                    if (err) {
                        const error: string = `SolrClient.commit failed: ${JSON.stringify(err)}`;
                        LOG.error(error, LOG.LS.eNAV);
                        resolve({ success: false, error });
                    } else
                        resolve({ success: true });
                });
            });
        } catch (err) /* istanbul ignore next */ {
            const error: string = `SolrClient.commit failed: ${JSON.stringify(err)}`;
            LOG.error(error, LOG.LS.eNAV);
            return { success: false, error };
        }
    }
}
