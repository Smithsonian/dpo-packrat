/* eslint-disable @typescript-eslint/no-explicit-any */
import * as EVENT from '../../interface';
import { EventConsumer } from './EventConsumer';
import { EventConsumerDB } from './EventConsumerDB';
import { EventEngine } from './EventEngine';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

export class EventConsumerAuth extends EventConsumer {
    constructor(engine: EventEngine) {
        super(engine);
    }

    protected async eventWorker<Key, Value>(data: EVENT.IEventData<Key, Value>[]): Promise<void> {
        // inform audit interface of authentication event
        for (const dataItem of data) {
            if (typeof(dataItem.key) !== 'number') {
                RK.logError(RK.LogSection.eEVENT,'send event failed','sent event with unknown key',{ key: dataItem.key },'EventConsumerAuth');
                continue;
            }

            switch (dataItem.key) {
                case EVENT.eEventKey.eAuthLogin:
                case EVENT.eEventKey.eAuthFailed: {
                    const audit: DBAPI.Audit = EventConsumerDB.convertDataToAudit(dataItem.value);
                    if (audit.idAudit === 0)
                        audit.create(); // don't use await so this happens asynchronously

                    RK.logDebug(RK.LogSection.eEVENT,`login event ${dataItem.key === EVENT.eEventKey.eAuthLogin ? 'success' : 'failed'}`,undefined,this.parseAuditData(audit.Data),'EventConsumerAuth');
                } break;

                default:
                    RK.logError(RK.LogSection.eEVENT,'send event failed','sent event with unsupported key',{ key: dataItem.key },'EventConsumerAuth');
                    break;
            }
        }
    }

    private parseAuditData(data: string | null): Record<string, any> | null {
        if (!data) return null;

        try {
            const parsed = H.Helpers.JSONParse(data);

            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                const result: Record<string, any> = {};

                if ('error' in parsed) {
                    result.reason = parsed.error;
                    delete parsed.error;
                }

                // Add remaining properties
                for (const [key, value] of Object.entries(parsed)) {
                    result[key] = value;
                }

                return result;
            }
        } catch {
            return { reason: 'Invalid JSON in audit.Data' };
        }

        return null;
    }

}
