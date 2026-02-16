import { Request, Response } from 'express';
import * as NAV from '../../navigation/interface';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import { isAuthenticated } from '../auth';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { eEventKey } from '../../event/interface/EventEnums';
import * as H from '../../utils/helpers';

export async function solrindex(request: Request, response: Response): Promise<void> {
    if (!isAuthenticated(request)) {
        AuditFactory.audit({ url: request.path, auth: false }, { eObjectType: 0, idObject: 0 }, eEventKey.eHTTPDownload);
        RK.logError(RK.LogSection.eHTTP,'index failed','not authenticated',{ url: request.path },'HTTP.Solr.Index');
        response.status(403).json({ success: false, message: 'not authenticated' });
        return;
    }

    const indexer: NAV.IIndexer | null = await fetchIndexer(response);
    if (!indexer)
        return;
    try {
        const success: boolean = await indexer.fullIndex();
        if(success===true)
            RK.logInfo(RK.LogSection.eHTTP,'index success',undefined,H.Helpers.cleanExpressRequest(request),'HTTP.Solr.Index');
        else
            RK.logError(RK.LogSection.eHTTP,'index failed','cannot execute fullIndex',H.Helpers.cleanExpressRequest(request),'HTTP.Solr.Index');

        response.json({ success, message: `Solr Indexing Completed: ${success ? 'Success' : 'Failure'}` });

    } catch (error) {
        RK.logError(RK.LogSection.eHTTP,'index failed',H.Helpers.getErrorString(error),H.Helpers.cleanExpressRequest(request),'HTTP.Solr.Index');
        response.status(500).json({ success: false, message: 'Solr Indexing failed due to an internal error' });
    }
}

export async function solrindexprofiled(request: Request, response: Response): Promise<void> {
    if (!isAuthenticated(request)) {
        AuditFactory.audit({ url: request.path, auth: false }, { eObjectType: 0, idObject: 0 }, eEventKey.eHTTPDownload);
        RK.logError(RK.LogSection.eHTTP,'index profiled failed','not authenticated',{ url: request.path },'HTTP.Solr.Index');
        response.status(403).json({ success: false, message: 'not authenticated' });
        return;
    }

    const indexer: NAV.IIndexer | null = await fetchIndexer(response);
    if (!indexer)
        return;
    try {
        const success: boolean = await indexer.fullIndex(true);
        if(success===true)
            RK.logInfo(RK.LogSection.eHTTP,'index profiled success',undefined,H.Helpers.cleanExpressRequest(request),'HTTP.Solr.Index');
        else
            RK.logError(RK.LogSection.eHTTP,'index profiled failed','cannot execute fullIndex',H.Helpers.cleanExpressRequest(request),'HTTP.Solr.Index');

        response.json({ success, message: `Solr Indexing Completed: ${success ? 'Success' : 'Failure'}` });
    } catch (error) {
        RK.logError(RK.LogSection.eHTTP,'index profiled failed',H.Helpers.getErrorString(error),H.Helpers.cleanExpressRequest(request),'HTTP.Solr.Index');
        response.status(500).json({ success: false, message: 'Solr Indexing failed due to an internal error' });
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