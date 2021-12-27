import { INavigation } from './INavigation';
import { IIndexer } from './IIndexer';
import { NavigationDB } from '../impl';
import { NavigationSolr } from '../impl/NavigationSolr';
import { Config, NAVIGATION_TYPE } from '../../config';
import * as LOG from '../../utils/logger';

export class NavigationFactory {
    private static instance: INavigation | null = null;
    private static objectIndexSet: Set<number> | null = null;
    private static OBJECT_INDEX_BATCH_TIME: number = 30000; // 30s

    static async getInstance(eNavType: NAVIGATION_TYPE = NAVIGATION_TYPE.DEFAULT): Promise<INavigation| null> {
        if (eNavType == NAVIGATION_TYPE.DEFAULT)
            eNavType = Config.navigation.type;

        /* istanbul ignore else */
        if (!NavigationFactory.instance) {
            switch (eNavType) {
                /* istanbul ignore next */
                default:
                case NAVIGATION_TYPE.DB: {
                    NavigationFactory.instance = new NavigationDB();
                    break;
                }
                case NAVIGATION_TYPE.SOLR: {
                    NavigationFactory.instance = new NavigationSolr();
                    break;
                }
            }
        }
        return NavigationFactory.instance;
    }

    static scheduleObjectIndexing(idSystemObject: number): void {
        let scheduleIndexing: boolean = false;
        if (!NavigationFactory.objectIndexSet) {
            NavigationFactory.objectIndexSet = new Set<number>();
            scheduleIndexing = true;
        }
        NavigationFactory.objectIndexSet.add(idSystemObject);

        // LOG.info(`NavigationFactory.objectIndexer scheduling ${idSystemObject}`, LOG.LS.eNAV);
        if (scheduleIndexing) {
            // LOG.info('NavigationFactory.objectIndexer starting timer', LOG.LS.eNAV);
            setTimeout(NavigationFactory.objectIndexer, NavigationFactory.OBJECT_INDEX_BATCH_TIME);
        }
    }

    static async objectIndexer(): Promise<void> {
        const nav: INavigation| null = await NavigationFactory.getInstance();
        if (!nav) {
            LOG.error('NavigationFactory.objectIndexer unable to fetch navigation instance', LOG.LS.eNAV);
            return;
        }

        if (!NavigationFactory.objectIndexSet) {
            LOG.info('NavigationFactory.objectIndexer indexing 0 objects', LOG.LS.eNAV);
            return;
        }

        const objects: number[] = Array.from(NavigationFactory.objectIndexSet);
        NavigationFactory.objectIndexSet = null;

        LOG.info(`NavigationFactory.objectIndexer indexing ${objects.length} objects`, LOG.LS.eNAV);
        for (const idSystemObject of objects) {
            // use a seperate indexer for each object so that we avoid short-circuiting inheritance relationships, used to populate ancestor and descendent information
            const indexer: IIndexer | null = nav ? await nav.getIndexer() : null;
            if (!indexer) {
                LOG.error('NavigationFactory.objectIndexer unable to fetch navigation indexer', LOG.LS.eNAV);
                return;
            }
            await indexer.indexObject(idSystemObject);
        }
    }
}
