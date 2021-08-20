import { IEventData } from './IEventEngine';
import { eEventTopic } from './EventEnums';

export interface IEventConsumer {
    /** Called for consumer to poll event system for events */
    poll<Key, Value>(eTopic: eEventTopic, timeout: number): Promise<IEventData<Key, Value>[] | null>;
    /** Called to let consumer know about events, when consumer has already been registered via IEventEngine.createConsumer(eTopic: eEventTopic) */
    event<Key, Value>(eTopic: eEventTopic, data: IEventData<Key, Value>[]): Promise<void>;
}
