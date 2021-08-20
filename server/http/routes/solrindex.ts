import { Request, Response } from 'express';
import * as NAV from '../../navigation/interface';
import * as LOG from '../../utils/logger';

export async function solrindex(_: Request, response: Response): Promise<void> {
    const indexer: NAV.IIndexer | null = await fetchIndexer(response);
    if (!indexer)
        return;
    try {
        const success: boolean = await indexer.fullIndex();
        response.send(`Solr Indexing Completed: ${success ? 'Success' : 'Failure'}`);
    } catch (error) {
        LOG.error('solrindex', LOG.LS.eHTTP, error);
    }
}

export async function solrindexprofiled(_: Request, response: Response): Promise<void> {
    const indexer: NAV.IIndexer | null = await fetchIndexer(response);
    if (!indexer)
        return;
    try {
        const success: boolean = await indexer.fullIndex(true);
        response.send(`Solr Indexing Completed: ${success ? 'Success' : 'Failure'}`);
    } catch (error) {
        LOG.error('solrindex', LOG.LS.eHTTP, error);
    }
}

async function fetchIndexer(response: Response): Promise<NAV.IIndexer | null> {
    const nav: NAV.INavigation | null = await NAV.NavigationFactory.getInstance();
    if (!nav) {
        LOG.error('solrindex unable to fetch INavigation', LOG.LS.eHTTP);
        response.send('Solr Indexing Completed: Failure');
        return null;
    }

    return await nav.getIndexer();
}