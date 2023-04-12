import * as EVENT from '../../interface';

import { EventEngineBase } from './EventEngineBase';

export class EventProducer implements EVENT.IEventProducer {
    private engine: EventEngineBase;
    constructor(engine: EventEngineBase) {
        this.engine = engine;
    }

    async send<Value>(eTopic: EVENT.eEventTopic, data: EVENT.IEventData<Value>[]): Promise<void> {
        this.engine.receive(eTopic, data); // call without await, allow to be async
    }
}