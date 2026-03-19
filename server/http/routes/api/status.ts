import { Request, Response } from 'express';
import * as DBAPI from '../../../db';
import { NavigationFactory, INavigation } from '../../../navigation/interface';
import { Config } from '../../../config';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import fetch from 'node-fetch';

interface ServiceStatus {
    database: boolean;
    solr: boolean;
    edan: boolean;
}

export async function getServiceStatus(_: Request, response: Response): Promise<void> {
    const status: ServiceStatus = {
        database: false,
        solr: false,
        edan: false,
    };

    // Check database
    try {
        const vocab = await DBAPI.Vocabulary.fetch(1);
        status.database = vocab !== null;
        if (!status.database)
            RK.logError(RK.LogSection.eHTTP, 'service status: database returned no data', undefined, {}, 'HTTP.Status');
    } catch (err) {
        RK.logError(RK.LogSection.eHTTP, 'service status: database unreachable',
            err instanceof Error ? err.message : String(err), {}, 'HTTP.Status');
    }

    // Check Solr
    try {
        const nav: INavigation | null = await NavigationFactory.getInstance();
        if (nav) {
            const result = await nav.getObjectChildren({
                idRoots: [],
                objectTypes: [],
                metadataColumns: [],
                search: '',
                objectsToDisplay: [],
                units: [],
                projects: [],
                has: [],
                missing: [],
                captureMethod: [],
                variantType: [],
                modelPurpose: [],
                modelFileType: [],
                dateCreatedFrom: null,
                dateCreatedTo: null,
                rows: 1,
                cursorMark: '',
            });
            status.solr = result.success;
            if (!status.solr)
                RK.logError(RK.LogSection.eHTTP, 'service status: Solr query failed', result.error, {}, 'HTTP.Status');
        }
    } catch (err) {
        RK.logError(RK.LogSection.eHTTP, 'service status: Solr unreachable',
            err instanceof Error ? err.message : String(err), {}, 'HTTP.Status');
    }

    // Check EDAN
    try {
        const edanServer = Config.collection.edan.server;
        const res = await fetch(edanServer, { method: 'GET', timeout: 5000 });
        status.edan = res.ok;
        if (!status.edan)
            RK.logError(RK.LogSection.eHTTP, 'service status: EDAN returned non-OK', res.statusText, {}, 'HTTP.Status');
    } catch (err) {
        RK.logError(RK.LogSection.eHTTP, 'service status: EDAN unreachable',
            err instanceof Error ? err.message : String(err), {}, 'HTTP.Status');
    }

    response.json(status);
}
