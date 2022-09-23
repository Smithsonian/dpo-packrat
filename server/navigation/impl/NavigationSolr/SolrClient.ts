/* eslint-disable @typescript-eslint/no-explicit-any */
import * as solr from 'solr-client';
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

    private static defaultSolrHost: string | undefined = undefined;
    private static defaultSolrPort: number = 8983;

    private static initDefaults(): void {
        const { PACKRAT_SOLR_HOST } = process.env;
        SolrClient.defaultSolrHost = PACKRAT_SOLR_HOST ?? 'packrat-solr';
    }

    constructor(host: string | null, port: number | null, eCore: eSolrCore | null) {
        if (!SolrClient.defaultSolrHost)
            SolrClient.initDefaults();

        if (!host)
            host = SolrClient.defaultSolrHost!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        if (!port)
            port = SolrClient.defaultSolrPort;

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
            await this._client.add(docs, undefined);
            return { success: true };
        } catch (err) /* istanbul ignore next */ {
            const error: string = `SolrClient.add failed: ${JSON.stringify(err)}`;
            LOG.error(error, LOG.LS.eNAV);
            return { success: false, error };
        }
    }

    async commit(): Promise<H.IOResults> {
        try {
            await this._client.commit(undefined);
            return { success: true };
        } catch (err) /* istanbul ignore next */ {
            const error: string = `SolrClient.commit failed: ${JSON.stringify(err)}`;
            LOG.error(error, LOG.LS.eNAV);
            return { success: false, error };
        }
    }
}
