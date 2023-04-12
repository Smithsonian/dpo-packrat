import * as EVENT from '../../interface';

export abstract class EventEngineBase {
    abstract receive<Value>(eTopic: EVENT.eEventTopic, data: EVENT.IEventData<Value>[]): Promise<void>;
}
