import { Request, Response } from 'express';
import { IndexSolr } from '../../navigation/impl/NavigationSolr/IndexSolr';

export async function solrindex(_: Request, response: Response): Promise<void> {
    const indexer: IndexSolr = new IndexSolr();
    const success: boolean = await indexer.fullIndex();
    response.send(`Solr Indexing Completed: ${success ? 'Success' : 'Failure'}`);
}

export async function solrindexprofiled(_: Request, response: Response): Promise<void> {
    const indexer: IndexSolr = new IndexSolr();
    const success: boolean = await indexer.fullIndexProfiled();
    response.send(`Solr Indexing Completed: ${success ? 'Success' : 'Failure'}`);
}