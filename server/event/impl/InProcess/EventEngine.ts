import * as EVENT from '../../interface';
import { EventProducer } from './EventProducer';
import { EventConsumer } from './EventConsumer';
import { EventConsumerAuth } from './EventConsumerAuth';
import { EventConsumerDB } from './EventConsumerDB';
import { EventConsumerPublish } from './EventConsumerPublish';
import { EventConsumerHTTP } from './EventConsumerHTTP';
import { IEventData } from '../../interface';
import * as LOG from '../../../utils/logger';
// import * as H from '../../../utils/helpers';

// Maintains a set of registered consumers per topic
// EventConsumer.poll registers a consumer and then deregisters it
export class EventEngine implements EVENT.IEventEngine {
    private consumerMap: Map<EVENT.eEventTopic, Set<EventConsumer>> = new Map<EVENT.eEventTopic, Set<EventConsumer>>();
    private static eventProducer: EVENT.IEventProducer | null = null;

    constructor() {
        LOG.info('EventEngine.constructor, wiring default consumers', LOG.LS.eEVENT);
        this.createSystemConsumer(EVENT.eEventTopic.eDB);
        this.createSystemConsumer(EVENT.eEventTopic.eAuth);
        this.createSystemConsumer(EVENT.eEventTopic.ePublish);
        this.createSystemConsumer(EVENT.eEventTopic.eHTTP);
        this.createSystemConsumer(EVENT.eEventTopic.eJob);
        this.createSystemConsumer(EVENT.eEventTopic.eWF);
    }

    // #region IEventEngine interface, for creating event producers and managing event consumers
    async send<Value>(eTopic: EVENT.eEventTopic, data: IEventData<Value>[]): Promise<void> {
        if (EventEngine.eventProducer === null)
            EventEngine.eventProducer = await this.createProducer();
        if (EventEngine.eventProducer === null) {
            LOG.error('EventEngine.send unable to create defualt event producer', LOG.LS.eEVENT);
            return;
        }
        EventEngine.eventProducer.send(eTopic, data);
    }

    async createProducer(): Promise<EVENT.IEventProducer | null> {
        LOG.info('EventEngine.createProducer', LOG.LS.eEVENT);
        return new EventProducer(this);
    }

    async registerConsumer(eTopic: EVENT.eEventTopic, consumer: EventConsumer): Promise<boolean> {
        LOG.info(`EventEngine.registerConsumer ${EVENT.eEventTopic[eTopic]}`, LOG.LS.eEVENT);
        let consumerSet: Set<EventConsumer> | undefined = this.consumerMap.get(eTopic);
        if (!consumerSet) {
            consumerSet = new Set<EventConsumer>();
            this.consumerMap.set(eTopic, consumerSet);
        }
        consumerSet.add(consumer);
        return true;
    }

    async unregisterConsumer(eTopic: EVENT.eEventTopic, consumer: EventConsumer): Promise<boolean> {
        LOG.info(`EventEngine.unregisterConsumer ${EVENT.eEventTopic[eTopic]}`, LOG.LS.eEVENT);
        const consumerSet: Set<EventConsumer> | undefined = this.consumerMap.get(eTopic);
        if (consumerSet) {
            consumerSet.delete(consumer);
            return true;
        }
        return false;
    }
    // #endregion

    // #region EventEngine interface, for receiving events from EventProducer
    async receive<Value>(eTopic: EVENT.eEventTopic, data: IEventData<Value>[]): Promise<void> {
        // LOG.info(`EventEngine.receive ${EVENT.eEventTopic[eTopic]}: ${JSON.stringify(data, H.Helpers.stringifyDatabaseRow)}`, LOG.LS.eEVENT);
        const consumerSet: Set<EventConsumer> | undefined = this.consumerMap.get(eTopic);
        if (consumerSet) {
            for (const consumer of consumerSet)
                consumer.event(eTopic, data); // call without await, allow async
        }
    }
    // #endregion

    // #region EventEngine implementation
    private async createSystemConsumer(eTopic: EVENT.eEventTopic): Promise<EVENT.IEventConsumer | null> {
        LOG.info(`EventEngine.createConsumer ${EVENT.eEventTopic[eTopic]}`, LOG.LS.eEVENT);
        let consumer: EventConsumer | null = null;

        switch (eTopic) {
            case EVENT.eEventTopic.eAuth: consumer = new EventConsumerAuth(this); break;
            case EVENT.eEventTopic.eDB: consumer = new EventConsumerDB(this); break;
            case EVENT.eEventTopic.ePublish: consumer = new EventConsumerPublish(this); break;
            case EVENT.eEventTopic.eHTTP: consumer = new EventConsumerHTTP(this); break;
            default: {
                LOG.error(`EventEngine.createConsumer called with an unexpected topic ${EVENT.eEventTopic[eTopic]}`, LOG.LS.eEVENT);
                return null;
            }
        }

        await this.registerConsumer(eTopic, consumer);
        return consumer;
    }
    // #endregion
}
