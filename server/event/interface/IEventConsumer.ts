import { IEventData } from './IEventData';
import { eEventTopic } from './EventEnums';

export interface IEventConsumer {
    // /** Called for consumer to poll event system for events */
    // poll<Value>(eTopic: eEventTopic, timeout: number): Promise<IEventData<Value>[] | null>;
    /** Called to let consumer know about events, when consumer has already been registered via IEventEngine.createConsumer(eTopic: eEventTopic) */
    event<Value>(eTopic: eEventTopic, data: IEventData<Value>[]): Promise<void>;
}
