import { IEventData } from './IEventEngine';
import { eEventTopic } from './EventEnums';

export interface IEventProducer {
    send<Value>(eTopic: eEventTopic, data: IEventData<Value>[]): Promise<void>;
}
