import * as EVENT from '../../interface';
import { EventConsumer } from './EventConsumer';
import { EventEngine } from './EventEngine';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import { IndexSolr } from '../../../navigation/impl/NavigationSolr/IndexSolr';
import * as LOG from '../../../utils/logger';

export class EventConsumerDB extends EventConsumer {
    constructor(engine: EventEngine) {
        super(engine);
    }

    protected async eventWorker<Key, Value>(data: EVENT.IEventData<Key, Value>[]): Promise<void> {
        // inform audit interface of db event
        // inform cache and solr of systemobject events
        for (const dataItem of data) {
            if (typeof(dataItem.key) !== 'number') {
                LOG.error(`EventConsumerDB.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                continue;
            }

            switch (dataItem.key) {
                case EVENT.eEventKey.eDBCreate:
                case EVENT.eEventKey.eDBUpdate:
                case EVENT.eEventKey.eDBDelete:
                    if (dataItem.value instanceof DBAPI.Audit) {
                        const idSystemObject: number | null = dataItem.value.idSystemObject;
                        if (idSystemObject) {
                            CACHE.SystemObjectCache.flushObject(idSystemObject);    // don't use await so this happens asynchronously

                            const indexer: IndexSolr = new IndexSolr();
                            indexer.indexObject(idSystemObject);                    // don't use await so this happens asynchronously
                        }

                        if (dataItem.value.idAudit === 0)
                            dataItem.value.create();                                // don't use await so this happens asynchronously
                    } else
                        LOG.error(`EventConsumerDB.eventWorker sent event with unknown data ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                    break;

                default:
                    LOG.error(`EventConsumerDB.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                    break;
            }
        }
    }
}
