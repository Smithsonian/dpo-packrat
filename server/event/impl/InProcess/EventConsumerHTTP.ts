import * as EVENT from '../../interface';
import { EventConsumer } from './EventConsumer';
import { EventConsumerDB } from './EventConsumerDB';
import { EventEngine } from './EventEngine';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

export class EventConsumerHTTP extends EventConsumer {
    constructor(engine: EventEngine) {
        super(engine);
    }

    protected async eventWorker<Key, Value>(data: EVENT.IEventData<Key, Value>[]): Promise<void> {
        // inform audit interface of authentication event
        for (const dataItem of data) {
            if (typeof(dataItem.key) !== 'number') {
                RK.logError(RK.LogSection.eEVENT,'event worker failed','sent event with unknown key',{ ...dataItem },'Event.Consumer.HTTP');
                continue;
            }

            switch (dataItem.key) {
                case EVENT.eEventKey.eHTTPDownload:
                case EVENT.eEventKey.eHTTPUpload:
                case EVENT.eEventKey.eSolrRebuild: {
                    const audit: DBAPI.Audit = EventConsumerDB.convertDataToAudit(dataItem.value);
                    const oID: DBAPI.ObjectIDAndType = { idObject: audit.idDBObject ?? 0, eObjectType: audit.DBObjectType ?? 0 };

                    if (audit.idSystemObject === null && audit.idDBObject && audit.DBObjectType) {
                        const SOInfo: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
                        if (SOInfo)
                            audit.idSystemObject = SOInfo.idSystemObject;
                    }

                    if (audit.idAudit === 0)
                        audit.create(); // don't use await so this happens asynchronously

                    RK.logInfo(RK.LogSection.eEVENT,'event worker success',undefined,{ dataItem, objectID: oID },'Event.Consumer.HTTP');
                } break;

                default:
                    RK.logError(RK.LogSection.eEVENT,'event worker failed','unsupported key',{ ...dataItem },'Event.Consumer.HTTP');
                    break;
            }
        }
    }
}
