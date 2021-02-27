/* eslint-disable @typescript-eslint/no-explicit-any */
import solr from 'solr-client';

export class SolrClient {
    _client: solr.Client;
    private _host: string;
    private _port: number;
    private _core: string;

    constructor(host: string | null, port: number | null, core: string | null) {
        if (!host) {
            const { PACKRAT_SOLR_HOST } = process.env;
            host = PACKRAT_SOLR_HOST || 'packrat-solr';
        }
        if (!port)
            port = 8983;
        if (!core)
            core = 'packrat';
        this._host = host;
        this._port = port;
        this._core = core;
        this._client = solr.createClient({ host, port, core });
    }

    solrUrl(): string {
        return `http://${this._host}:${this._port}/solr/${this._core}`;
    }
}
