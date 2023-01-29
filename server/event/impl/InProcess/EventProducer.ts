import * as EVENT from '../../interface';
import { EventEngine } from './EventEngine';

export class EventProducer implements EVENT.IEventProducer {
    private engine: EventEngine;
    constructor(engine: EventEngine) {
        this.engine = engine;
    }

    async send<Value>(eTopic: EVENT.eEventTopic, data: EVENT.IEventData<Value>[]): Promise<void> {
        this.engine.receive(eTopic, data); // call without await, allow to be async
    }
}