import * as EVENT from '../../interface';
import { EventConsumer } from './EventConsumer';
import { EventEngine } from './EventEngine';
import * as WF from '../../../workflow/interface';
import * as LOG from '../../../utils/logger';

export class EventConsumerWF extends EventConsumer {
    private static workflowEngine: WF.IWorkflowEngine | null;

    constructor(engine: EventEngine) {
        super(engine);
    }

    protected async eventWorker<Value>(data: EVENT.IEventData<Value>[]): Promise<void> {
        if (!EventConsumerWF.workflowEngine)
            EventConsumerWF.workflowEngine = await WF.WorkflowFactory.getInstance();
        if (!EventConsumerWF.workflowEngine) {
            LOG.error('EventConsumerWF.eventWorker unable to fetch WorkflowEngine', LOG.LS.eEVENT);
            return;
        }

        // inform workflow engine of workflow events
        for (const dataItem of data) {
            if (typeof(dataItem.key) !== 'number') {
                LOG.error(`EventConsumerWF.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                continue;
            }

            switch (dataItem.key) {
                case EVENT.eEventKey.eWFIngestObject: {
                    LOG.info(`EventConsumerWF.eventWorker ${EVENT.eEventKey[dataItem.key]} ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                    // Take action here:
                    // EventConsumerWF.workflowEngine.event(dataItem);
                } break;

                default:
                    LOG.error(`EventConsumerWF.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                    break;
            }
        }
    }
}
