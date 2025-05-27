import { Request, Response } from 'express';
import * as NAV from '../../navigation/interface';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import * as H from '../../utils/helpers';

export async function solrindex(_request: Request, response: Response): Promise<void> {
    const indexer: NAV.IIndexer | null = await fetchIndexer(response);
    if (!indexer)
        return;
    try {
        const success: boolean = await indexer.fullIndex();
        if(success===true)
            RK.logInfo(RK.LogSection.eHTTP,'index success',undefined,H.Helpers.cleanExpressRequest(_request),'HTTP.Solr.Index');
        else
            RK.logError(RK.LogSection.eHTTP,'index failed','cannot execute fullIndex',H.Helpers.cleanExpressRequest(_request),'HTTP.Solr.Index');

        response.send(`Solr Indexing Completed: ${success ? 'Success' : 'Failure'}`);

    } catch (error) {
        RK.logError(RK.LogSection.eHTTP,'index failed',H.Helpers.getErrorString(error),H.Helpers.cleanExpressRequest(_request),'HTTP.Solr.Index');
    }
}

export async function solrindexprofiled(_request: Request, response: Response): Promise<void> {
    const indexer: NAV.IIndexer | null = await fetchIndexer(response);
    if (!indexer)
        return;
    try {
        const success: boolean = await indexer.fullIndex(true);
        if(success===true)
            RK.logInfo(RK.LogSection.eHTTP,'index profiled success',undefined,H.Helpers.cleanExpressRequest(_request),'HTTP.Solr.Index');
        else
            RK.logError(RK.LogSection.eHTTP,'index profiled failed','cannot execute fullIndex',H.Helpers.cleanExpressRequest(_request),'HTTP.Solr.Index');

        response.send(`Solr Indexing Completed: ${success ? 'Success' : 'Failure'}`);
    } catch (error) {
        RK.logError(RK.LogSection.eHTTP,'index profiled failed',H.Helpers.getErrorString(error),H.Helpers.cleanExpressRequest(_request),'HTTP.Solr.Index');
    }
}

async function fetchIndexer(response: Response): Promise<NAV.IIndexer | null> {
    const nav: NAV.INavigation | null = await NAV.NavigationFactory.getInstance();
    if (!nav) {
        RK.logCritical(RK.LogSection.eHTTP,'fetch indexer failed','unable to fetch INavigation',undefined,'HTTP.Solr.Index');
        response.send('Solr Indexing Completed: Failure');
        return null;
    }

    return await nav.getIndexer();
}