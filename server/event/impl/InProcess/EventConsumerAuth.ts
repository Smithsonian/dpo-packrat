import * as EVENT from '../../interface';
import { EventConsumer } from './EventConsumer';
import { EventConsumerDB } from './EventConsumerDB';
import { EventEngine } from './EventEngine';
import * as DBAPI from '../../../db';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';

export class EventConsumerAuth extends EventConsumer {
    constructor(engine: EventEngine) {
        super(engine);
    }

    protected async eventWorker<Key, Value>(data: EVENT.IEventData<Key, Value>[]): Promise<void> {
        // inform audit interface of authentication event
        for (const dataItem of data) {
            if (typeof(dataItem.key) !== 'number') {
                LOG.error(`EventConsumerAuth.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                continue;
            }
            LOG.info(`EventConsumerAuth.eventWorker ${JSON.stringify(data, H.Helpers.stringifyDatabaseRow)}`, LOG.LS.eEVENT);

            switch (dataItem.key) {
                case EVENT.eEventKey.eAuthLogin: {
                    const audit: DBAPI.Audit = EventConsumerDB.convertDataToAudit(dataItem.value);
                    if (audit.idAudit === 0)
                        audit.create(); // don't use await so this happens asynchronously
                } break;

                default:
                    LOG.error(`EventConsumerAuth.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                    break;
            }
        }
    }
}
