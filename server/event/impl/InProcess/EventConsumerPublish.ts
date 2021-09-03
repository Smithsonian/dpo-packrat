import * as EVENT from '../../interface';
import { EventConsumer } from './EventConsumer';
import { EventConsumerDB } from './EventConsumerDB';
import { EventEngine } from './EventEngine';
import * as DBAPI from '../../../db';
import * as LOG from '../../../utils/logger';
import { PublishScene } from './PublishScene';

export class EventConsumerPublish extends EventConsumer {
    constructor(engine: EventEngine) {
        super(engine);
    }

    protected async eventWorker<Key, Value>(data: EVENT.IEventData<Key, Value>[]): Promise<void> {
        // inform audit interface of authentication event
        for (const dataItem of data) {
            if (typeof(dataItem.key) !== 'number') {
                LOG.error(`EventConsumerPublish.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                continue;
            }

            switch (dataItem.key) {
                case EVENT.eEventKey.eSceneQCd:
                    if (!await this.publishScene(dataItem.value))
                        LOG.error('EventConsumerPublish.eventWorker failed publishing scene', LOG.LS.eEVENT);
                    break;

                default:
                    LOG.error(`EventConsumerPublish.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                    break;
            }
        }
    }

    protected async publishScene<Value>(dataItemValue: Value): Promise<boolean> {
        const audit: DBAPI.Audit = EventConsumerDB.convertDataToAudit(dataItemValue);
        const PS: PublishScene = new PublishScene(audit);
        return await PS.publish();
    }
}
