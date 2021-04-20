import { IEventData } from './IEventEngine';
import { eEventTopic } from './EventEnums';

export interface IEventProducer {
    send<Key, Value>(eTopic: eEventTopic, data: IEventData<Key, Value>[]): Promise<void>;
}
