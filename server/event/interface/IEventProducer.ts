import { IEventData } from './IEventData';
import { eEventTopic } from './EventEnums';

export interface IEventProducer {
    send<Value>(eTopic: eEventTopic, data: IEventData<Value>[]): Promise<void>;
}
