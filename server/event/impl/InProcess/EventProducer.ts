import * as EVENT from '../../interface';

declare class EventEngine {
    receive<Value>(eTopic: EVENT.eEventTopic, data: EVENT.IEventData<Value>[]): Promise<void>;
}

export class EventProducer implements EVENT.IEventProducer {
    private engine: EventEngine;
    constructor(engine: EventEngine) {
        this.engine = engine;
    }

    async send<Value>(eTopic: EVENT.eEventTopic, data: EVENT.IEventData<Value>[]): Promise<void> {
        this.engine.receive(eTopic, data); // call without await, allow to be async
    }
}