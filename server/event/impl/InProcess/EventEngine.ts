import * as EVENT from '../../interface';
import { EventProducer } from './EventProducer';
import { EventConsumer } from './EventConsumer';
import { EventConsumerAuth } from './EventConsumerAuth';
import { EventConsumerDB } from './EventConsumerDB';
import { EventConsumerPublish } from './EventConsumerPublish';
import { EventConsumerHTTP } from './EventConsumerHTTP';
import { IEventData } from '../../interface';
// import * as LOG from '../../../utils/logger';
import { RecordKeeper as RK, IOResults } from '../../../records/recordKeeper';
// import * as H from '../../../utils/helpers';

// Maintains a set of registered consumers per topic
// EventConsumer.poll registerers a consumer and then deregisters it
export class EventEngine implements EVENT.IEventEngine {
    private consumerMap: Map<EVENT.eEventTopic, Set<EventConsumer>> = new Map<EVENT.eEventTopic, Set<EventConsumer>>();
    constructor() {
        // LOG.info('EventEngine.constructor, wiring default consumers', LOG.LS.eEVENT);        
    }

    async initialize(): Promise<IOResults> {
        RK.logDebug(RK.LogSection.eEVENT,'system initialize','wiring default consumers',{ consumers: 'DB, Auth, Publish, HTTP' },'EventEngine');
        await this.createConsumer(EVENT.eEventTopic.eDB);
        await this.createConsumer(EVENT.eEventTopic.eAuth);
        await this.createConsumer(EVENT.eEventTopic.ePublish);
        await this.createConsumer(EVENT.eEventTopic.eHTTP);

        return { success: true, message: 'EventEngine initialized', data: { consumers: 'DB, Auth, Publish, HTTP' }}
    }

    async createProducer(): Promise<EVENT.IEventProducer | null> {
        // LOG.info('EventEngine.createProducer', LOG.LS.eEVENT);
        RK.logDebug(RK.LogSection.eEVENT,'create event producer',undefined,undefined,'EventEngine');
        return new EventProducer(this);
    }

    async createConsumer(): Promise<EVENT.IEventConsumer | null>;
    async createConsumer(eTopic: EVENT.eEventTopic): Promise<EVENT.IEventConsumer | null>;
    async createConsumer(eTopic?: EVENT.eEventTopic): Promise<EVENT.IEventConsumer | null> {
        if (!eTopic) {
            // LOG.error('EventEngine.createConsumer called without an expected topic', LOG.LS.eEVENT);
            RK.logError(RK.LogSection.eEVENT,'create event consumer failed','called without expected topic',undefined,'EventEngine');
            return null;
        }

        // LOG.info(`EventEngine.createConsumer ${}`, LOG.LS.eEVENT);
        let consumer: EventConsumer | null = null;

        switch (eTopic) {
            case EVENT.eEventTopic.eAuth: consumer = new EventConsumerAuth(this); break;
            case EVENT.eEventTopic.eDB: consumer = new EventConsumerDB(this); break;
            case EVENT.eEventTopic.ePublish: consumer = new EventConsumerPublish(this); break;
            case EVENT.eEventTopic.eHTTP: consumer = new EventConsumerHTTP(this); break;
            default: {
                // LOG.error(`EventEngine.createConsumer called with an unexpected topic ${EVENT.eEventTopic[eTopic]}`, LOG.LS.eEVENT);
                RK.logError(RK.LogSection.eEVENT,'create event consumer failed','called without unexpected topic',{ topic: EVENT.eEventTopic[eTopic] },'EventEngine');
                return null;
            }
        }

        const registerResult: IOResults = await this.registerConsumer(eTopic, consumer);
        if(registerResult.success===false) {
            RK.logError(RK.LogSection.eEVENT,'create event consumer failed',registerResult.message,{ topic: EVENT.eEventTopic[eTopic] },'EventEngine');
            return null;
        }
        
        RK.logDebug(RK.LogSection.eEVENT,'create event consumer success',undefined,{ topic: EVENT.eEventTopic[eTopic] },'EventEngine');
        return consumer;
    }

    // #region EventEngine interface, for receiving events from EventProducer
    async registerConsumer(eTopic: EVENT.eEventTopic, consumer: EventConsumer): Promise<IOResults> {
        // LOG.info(`EventEngine.registerConsumer ${EVENT.eEventTopic[eTopic]}`, LOG.LS.eEVENT);

        let consumerSet: Set<EventConsumer> | undefined = this.consumerMap.get(eTopic);
        if (!consumerSet) {
            consumerSet = new Set<EventConsumer>();
            this.consumerMap.set(eTopic, consumerSet);
        }
        consumerSet.add(consumer);
        return { success: true, message: 'register event consumer success', data: { topic: EVENT.eEventTopic[eTopic] } };
    }

    async unregisterConsumer(eTopic: EVENT.eEventTopic, consumer: EventConsumer): Promise<void> {
        // LOG.info(`EventEngine.unregisterConsumer ${EVENT.eEventTopic[eTopic]}`, LOG.LS.eEVENT);
        RK.logDebug(RK.LogSection.eEVENT,'unregister event consumer',undefined,{ topic: EVENT.eEventTopic[eTopic] },'EventEngine');
        
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
