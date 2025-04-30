import * as EVENT from '../../interface';
import { EventConsumer } from './EventConsumer';
import { EventConsumerDB } from './EventConsumerDB';
import { EventEngine } from './EventEngine';
import * as DBAPI from '../../../db';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

export class EventConsumerAuth extends EventConsumer {
    constructor(engine: EventEngine) {
        super(engine);
    }

    protected async eventWorker<Key, Value>(data: EVENT.IEventData<Key, Value>[]): Promise<void> {
        // inform audit interface of authentication event
        for (const dataItem of data) {
            if (typeof(dataItem.key) !== 'number') {
                RK.logError(RK.LogSection.eEVENT,'send event failed','sent event with unknown key',{ key: dataItem.key },'EventConsumerAuth');
                continue;
            }

            switch (dataItem.key) {
                case EVENT.eEventKey.eAuthLogin:
                case EVENT.eEventKey.eAuthFailed: {
                    const audit: DBAPI.Audit = EventConsumerDB.convertDataToAudit(dataItem.value);
                    if (audit.idAudit === 0)
                        audit.create(); // don't use await so this happens asynchronously
                    RK.logDebug(RK.LogSection.eEVENT,`login event ${dataItem.key === EVENT.eEventKey.eAuthLogin ? 'success' : 'failed'}`,undefined,audit.Data,'EventConsumerAuth');
                } break;

                default:
                    RK.logError(RK.LogSection.eEVENT,'send event failed','sent event with unsupported key',{ key: dataItem.key },'EventConsumerAuth');
                    break;
            }
        }
    }
}
