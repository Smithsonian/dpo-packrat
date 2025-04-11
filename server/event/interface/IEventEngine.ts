import { IEventProducer } from './IEventProducer';
import { IEventConsumer } from './IEventConsumer';
import { eEventTopic } from './EventEnums';
import { IOResults } from '../../records/recordKeeper';

export interface IEventData<Key, Value> {
    eventDate: Date;
    key: Key;
    value: Value;
}

export interface IEventEngine {
    initialize(): Promise<IOResults>;
    
    createProducer(): Promise<IEventProducer | null>;
    createConsumer(): Promise<IEventConsumer | null>;
    /** Registers consumer for eTopic */
    createConsumer(eTopic: eEventTopic): Promise<IEventConsumer | null>;
}
