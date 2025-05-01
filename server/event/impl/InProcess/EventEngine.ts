import * as EVENT from '../../interface';
import { EventProducer } from './EventProducer';
import { EventConsumer } from './EventConsumer';
import { EventConsumerAuth } from './EventConsumerAuth';
import { EventConsumerDB } from './EventConsumerDB';
import { EventConsumerPublish } from './EventConsumerPublish';
import { EventConsumerHTTP } from './EventConsumerHTTP';
import { IEventData } from '../../interface';
import { RecordKeeper as RK, IOResults } from '../../../records/recordKeeper';
// import * as H from '../../../utils/helpers';

// Maintains a set of registered consumers per topic
// EventConsumer.poll registerers a consumer and then deregisters it
export class EventEngine implements EVENT.IEventEngine {
    private consumerMap: Map<EVENT.eEventTopic, Set<EventConsumer>> = new Map<EVENT.eEventTopic, Set<EventConsumer>>();
    constructor() {
    }

    async initialize(): Promise<IOResults> {
        RK.logDebug(RK.LogSection.eEVENT,'system initialize','wiring default consumers',{ consumers: 'DB, Auth, Publish, HTTP' },'EventEngine');

        const createdConsumers: string[] = [];
        await this.createConsumer(EVENT.eEventTopic.eDB) && createdConsumers.push('DB');
        await this.createConsumer(EVENT.eEventTopic.eAuth) && createdConsumers.push('Auth');
        await this.createConsumer(EVENT.eEventTopic.ePublish) && createdConsumers.push('Publish');
        await this.createConsumer(EVENT.eEventTopic.eHTTP) && createdConsumers.push('HTTP');

        if(createdConsumers.length===4)
            return { success: true, message: 'EventEngine initialized', data: { consumers: createdConsumers.join(', ') } };
        else
            return { success: false, message: 'EventEngine failed to initialize', data: { consumers: createdConsumers.join(', ') } };
    }

    async createProducer(): Promise<EVENT.IEventProducer | null> {
        // RK.logDebug(RK.LogSection.eEVENT,'create event producer',undefined,undefined,'EventEngine');
        return new EventProducer(this);
    }

    async createConsumer(): Promise<EVENT.IEventConsumer | null>;
    async createConsumer(eTopic: EVENT.eEventTopic): Promise<EVENT.IEventConsumer | null>;
    async createConsumer(eTopic?: EVENT.eEventTopic): Promise<EVENT.IEventConsumer | null> {
        if (!eTopic) {
            RK.logError(RK.LogSection.eEVENT,'create event consumer failed','called without expected topic',undefined,'EventEngine');
            return null;
        }

        let consumer: EventConsumer | null = null;

        switch (eTopic) {
            case EVENT.eEventTopic.eAuth: consumer = new EventConsumerAuth(this); break;
            case EVENT.eEventTopic.eDB: consumer = new EventConsumerDB(this); break;
            case EVENT.eEventTopic.ePublish: consumer = new EventConsumerPublish(this); break;
            case EVENT.eEventTopic.eHTTP: consumer = new EventConsumerHTTP(this); break;
            default: {
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

        let consumerSet: Set<EventConsumer> | undefined = this.consumerMap.get(eTopic);
        if (!consumerSet) {
            consumerSet = new Set<EventConsumer>();
            this.consumerMap.set(eTopic, consumerSet);
        }
        consumerSet.add(consumer);
        return { success: true, message: 'register event consumer success', data: { topic: EVENT.eEventTopic[eTopic] } };
    }

    async unregisterConsumer(eTopic: EVENT.eEventTopic, consumer: EventConsumer): Promise<void> {
        RK.logDebug(RK.LogSection.eEVENT,'unregister event consumer',undefined,{ topic: EVENT.eEventTopic[eTopic] },'EventEngine');

        const consumerSet: Set<EventConsumer> | undefined = this.consumerMap.get(eTopic);
        if (consumerSet)
            consumerSet.delete(consumer);
    }

    async receive<Key, Value>(eTopic: EVENT.eEventTopic, data: IEventData<Key, Value>[]): Promise<void> {
        const consumerSet: Set<EventConsumer> | undefined = this.consumerMap.get(eTopic);
        if (consumerSet) {
            for (const consumer of consumerSet)
                consumer.event(eTopic, data); // call without await, allow async
        }
    }
    // #endregion
}
