import * as EVENT from '../../interface';
import { EventProducer } from './EventProducer';
import { EventConsumer } from './EventConsumer';
import { EventConsumerAuth } from './EventConsumerAuth';
import { EventConsumerDB } from './EventConsumerDB';
import { EventConsumerPublish } from './EventConsumerPublish';
import { IEventData } from '../../interface';
import * as LOG from '../../../utils/logger';
// import * as H from '../../../utils/helpers';

// Maintains a set of registered consumers per topic
// EventConsumer.poll registerers a consumer and then deregisters it
export class EventEngine implements EVENT.IEventEngine {
    private consumerMap: Map<EVENT.eEventTopic, Set<EventConsumer>> = new Map<EVENT.eEventTopic, Set<EventConsumer>>();
    constructor() {
        LOG.info('EventEngine.constructor, wiring default consumers', LOG.LS.eEVENT);
        this.createConsumer(EVENT.eEventTopic.eDB);
        this.createConsumer(EVENT.eEventTopic.eAuth);
        this.createConsumer(EVENT.eEventTopic.ePublish);
    }

    async createProducer(): Promise<EVENT.IEventProducer | null> {
        LOG.info('EventEngine.createProducer', LOG.LS.eEVENT);
        return new EventProducer(this);
    }

    async createConsumer(): Promise<EVENT.IEventConsumer | null>;
    async createConsumer(eTopic: EVENT.eEventTopic): Promise<EVENT.IEventConsumer | null>;
    async createConsumer(eTopic?: EVENT.eEventTopic): Promise<EVENT.IEventConsumer | null> {
        if (!eTopic) {
            LOG.error('EventEngine.createConsumer called without an expected topic', LOG.LS.eEVENT);
            return null;
        }
        LOG.info(`EventEngine.createConsumer ${EVENT.eEventTopic[eTopic]}`, LOG.LS.eEVENT);
        let consumer: EventConsumer | null = null;

        switch (eTopic) {
            case EVENT.eEventTopic.eAuth: consumer = new EventConsumerAuth(this); break;
            case EVENT.eEventTopic.eDB: consumer = new EventConsumerDB(this); break;
            case EVENT.eEventTopic.ePublish: consumer = new EventConsumerPublish(this); break;
            default: {
                LOG.error(`EventEngine.createConsumer called with an unexpected topic ${EVENT.eEventTopic[eTopic]}`, LOG.LS.eEVENT);
                return null;
            }
        }

        await this.registerConsumer(eTopic, consumer);
        return consumer;
    }

    // #region EventEngine interface, for receiving events from EventProducer
    async registerConsumer(eTopic: EVENT.eEventTopic, consumer: EventConsumer): Promise<void> {
        LOG.info(`EventEngine.registerConsumer ${EVENT.eEventTopic[eTopic]}`, LOG.LS.eEVENT);
        let consumerSet: Set<EventConsumer> | undefined = this.consumerMap.get(eTopic);
        if (!consumerSet) {
            consumerSet = new Set<EventConsumer>();
            this.consumerMap.set(eTopic, consumerSet);
        }
        consumerSet.add(consumer);
    }

    async unregisterConsumer(eTopic: EVENT.eEventTopic, consumer: EventConsumer): Promise<void> {
        LOG.info(`EventEngine.unregisterConsumer ${EVENT.eEventTopic[eTopic]}`, LOG.LS.eEVENT);
        const consumerSet: Set<EventConsumer> | undefined = this.consumerMap.get(eTopic);
        if (consumerSet)
            consumerSet.delete(consumer);
    }

    async receive<Key, Value>(eTopic: EVENT.eEventTopic, data: IEventData<Key, Value>[]): Promise<void> {
        // LOG.info(`EventEngine.receive ${EVENT.eEventTopic[eTopic]}: ${JSON.stringify(data, H.Helpers.stringifyDatabaseRow)}`, LOG.LS.eEVENT);
        const consumerSet: Set<EventConsumer> | undefined = this.consumerMap.get(eTopic);
        if (consumerSet) {
            for (const consumer of consumerSet)
                consumer.event(eTopic, data); // call without await, allow async
        }
    }
    // #endregion
}
