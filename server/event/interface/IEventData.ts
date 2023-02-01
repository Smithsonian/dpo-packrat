import { eEventKey } from './EventEnums';

export interface IEventData<Value> {
    eventDate: Date;
    key: eEventKey;
    value: Value;
}