import { IEventEngine } from './IEventEngine';
import { EventEngine } from '../impl/InProcess';
import { Config, EVENT_TYPE } from '../../config';
import { AuditEventGenerator } from '../../audit/impl/AuditEventGenerator';
import { JobEngine } from '../../job/impl/NS/JobEngine';

export class EventFactory {
    private static instance: IEventEngine | null = null;

    static async getInstance(): Promise<IEventEngine | null> {
        /* istanbul ignore else */
        if (!EventFactory.instance) {
            switch (Config.event.type) {
                /* istanbul ignore next */
                default:
                case EVENT_TYPE.INPROCESS: {
                    EventFactory.instance = new EventEngine();
                    break;
                }
            }
            // Hack in an attempt to avoid circular dependencies
            // Here, we tell our various event generators to use our newly-created EventFactory
            AuditEventGenerator.setEventEngine(EventFactory.instance);
            JobEngine.setEventEngine(EventFactory.instance);
        }
        return EventFactory.instance;
    }
}
