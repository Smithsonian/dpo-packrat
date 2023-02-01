import { IEventData } from './IEventData';
import { IEventProducer } from './IEventProducer';
import { IEventConsumer } from './IEventConsumer';
import { eEventTopic } from './EventEnums';

export interface IEventEngine {
    /** Publish an event */
    send<Value>(eTopic: eEventTopic, data: IEventData<Value>[]): Promise<void>;

    /** Create an event producer for use in publishing an event */
    createProducer(): Promise<IEventProducer | null>;
    registerConsumer(eTopic: eEventTopic, consumer: IEventConsumer): Promise<boolean>;
    unregisterConsumer(eTopic: eEventTopic, consumer: IEventConsumer): Promise<boolean>;
}
