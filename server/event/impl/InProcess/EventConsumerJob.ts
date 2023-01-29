import * as EVENT from '../../interface';
import { EventConsumer } from './EventConsumer';
import { EventEngine } from './EventEngine';
import * as JOB from '../../../job/interface';
import * as LOG from '../../../utils/logger';

export class EventConsumerJob extends EventConsumer {
    private static jobEngine: JOB.IJobEngine | null;

    constructor(engine: EventEngine) {
        super(engine);
    }

    protected async eventWorker<Value>(data: EVENT.IEventData<Value>[]): Promise<void> {
        if (!EventConsumerJob.jobEngine)
            EventConsumerJob.jobEngine = await JOB.JobFactory.getInstance();
        if (!EventConsumerJob.jobEngine) {
            LOG.error('EventConsumerJob.eventWorker unable to fetch JobEngine', LOG.LS.eEVENT);
            return;
        }

        // inform job engine job events
        for (const dataItem of data) {
            if (typeof(dataItem.key) !== 'number') {
                LOG.error(`EventConsumerJob.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                continue;
            }

            switch (dataItem.key) {
                case EVENT.eEventKey.eJobCreated:
                case EVENT.eEventKey.eJobRunning:
                case EVENT.eEventKey.eJobUpdated:
                case EVENT.eEventKey.eJobWaiting:
                case EVENT.eEventKey.eJobDone:
                case EVENT.eEventKey.eJobError:
                case EVENT.eEventKey.eJobCancelled: {
                    LOG.info(`EventConsumerJob.eventWorker ${EVENT.eEventKey[dataItem.key]} ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                    EventConsumerJob.jobEngine.jobEvent(dataItem);
                } break;

                default:
                    LOG.error(`EventConsumerJob.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                    break;
            }
        }
    }
}
