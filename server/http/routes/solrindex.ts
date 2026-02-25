import { Request, Response } from 'express';
import * as NAV from '../../navigation/interface';
import { IndexSolr, eSolrIndexPhase } from '../../navigation/impl/NavigationSolr';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import { isAuthenticated } from '../auth';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { eEventKey } from '../../event/interface/EventEnums';
import { ASL, LocalStore } from '../../utils/localStore';
import { Config } from '../../config';
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

    // POST: non-blocking fire-and-forget
    if (request.method === 'POST') {
        const { phase } = IndexSolr.progress;
        if (phase === eSolrIndexPhase.eDeleting || phase === eSolrIndexPhase.eObjects || phase === eSolrIndexPhase.eMetadata) {
            response.json({ success: false, message: 'Solr indexing already underway' });
            return;
        }
        // fire-and-forget: do not await
        indexer.fullIndex().then((success) => {
            if (success)
                RK.logInfo(RK.LogSection.eHTTP,'index success',undefined,H.Helpers.cleanExpressRequest(request),'HTTP.Solr.Index');
            else
                RK.logError(RK.LogSection.eHTTP,'index failed','cannot execute fullIndex',H.Helpers.cleanExpressRequest(request),'HTTP.Solr.Index');
        }).catch((error) => {
            RK.logError(RK.LogSection.eHTTP,'index failed',H.Helpers.getErrorString(error),H.Helpers.cleanExpressRequest(request),'HTTP.Solr.Index');
        });
        response.json({ success: true, message: 'Solr indexing started' });
        return;
    }

    // GET: blocking (backward compat / direct browser use)
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

export async function solrindexstatus(request: Request, response: Response): Promise<void> {
    if (!isAuthenticated(request)) {
        AuditFactory.audit({ url: request.path, auth: false }, { eObjectType: 0, idObject: 0 }, eEventKey.eHTTPDownload);
        RK.logError(RK.LogSection.eHTTP,'index status failed','not authenticated',{ url: request.path },'HTTP.Solr.Index');
        response.status(403).json({ success: false, message: 'not authenticated' });
        return;
    }
    response.json({ success: true, progress: IndexSolr.progress });
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

export async function solrrebuild(request: Request, response: Response): Promise<void> {
    if (!isAuthenticated(request)) {
        AuditFactory.audit({ url: request.path, auth: false }, { eObjectType: 0, idObject: 0 }, eEventKey.eHTTPDownload);
        RK.logError(RK.LogSection.eHTTP,'rebuild failed','not authenticated',{ url: request.path },'HTTP.Solr.Rebuild');
        response.status(403).json({ success: false, message: 'not authenticated' });
        return;
    }

    // Admin-only authorization
    const LS: LocalStore | undefined = ASL.getStore();
    if (!LS || !LS.idUser || !Config.auth.users.admin.includes(LS.idUser)) {
        RK.logError(RK.LogSection.eHTTP,'rebuild failed','not authorized (admin only)',{ url: request.path },'HTTP.Solr.Rebuild');
        response.status(403).json({ success: false, message: 'not authorized (admin only)' });
        return;
    }

    const indexer: NAV.IIndexer | null = await fetchIndexer(response);
    if (!indexer)
        return;

    const { phase } = IndexSolr.progress;
    if (phase === eSolrIndexPhase.eDeleting || phase === eSolrIndexPhase.eObjects || phase === eSolrIndexPhase.eMetadata) {
        response.json({ success: false, message: 'Solr indexing already underway' });
        return;
    }

    AuditFactory.audit({ url: request.path, auth: true }, { eObjectType: 0, idObject: 0 }, eEventKey.eSolrRebuild);

    // fire-and-forget: do not await
    indexer.rebuildIndex().then((success) => {
        if (success)
            RK.logInfo(RK.LogSection.eHTTP,'rebuild success',undefined,H.Helpers.cleanExpressRequest(request),'HTTP.Solr.Rebuild');
        else
            RK.logError(RK.LogSection.eHTTP,'rebuild failed','cannot execute rebuildIndex',H.Helpers.cleanExpressRequest(request),'HTTP.Solr.Rebuild');
    }).catch((error) => {
        RK.logError(RK.LogSection.eHTTP,'rebuild failed',H.Helpers.getErrorString(error),H.Helpers.cleanExpressRequest(request),'HTTP.Solr.Rebuild');
    });
    response.json({ success: true, message: 'Solr rebuild started' });
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