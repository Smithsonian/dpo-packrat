import { IEventProducer } from './IEventProducer';
import { IEventConsumer } from './IEventConsumer';
import { eEventTopic, eEventKey } from './EventEnums';

export interface IEventData<Value> {
    eventDate: Date;
    key: eEventKey;
    value: Value;
}

export interface IEventEngine {
    createProducer(): Promise<IEventProducer | null>;
    registerConsumer(eTopic: eEventTopic, consumer: IEventConsumer): Promise<boolean>;
    unregisterConsumer(eTopic: eEventTopic, consumer: IEventConsumer): Promise<boolean>;
}
