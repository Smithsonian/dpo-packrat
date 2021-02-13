/* eslint-disable @typescript-eslint/no-explicit-any */
import solr from 'solr-client';

export class SolrClient {
    _client: solr.Client;

    constructor(host: string | null, port: number | null, core: string | null) {
        if (!host)
            host = 'packrat-solr';
        if (!port)
            port = 8983;
        if (!core)
            core = 'packrat';
        this._client = solr.createClient({ host, port, core });
    }
}
