import * as EVENT from '../../interface';
import { EventConsumer } from './EventConsumer';
import { EventConsumerDB } from './EventConsumerDB';
import { EventEngine } from './EventEngine';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as LOG from '../../../utils/logger';

export class EventConsumerHTTP extends EventConsumer {
    constructor(engine: EventEngine) {
        super(engine);
    }

    protected async eventWorker<Value>(data: EVENT.IEventData<Value>[]): Promise<void> {
        // inform audit interface of download & upload events
        for (const dataItem of data) {
            if (typeof(dataItem.key) !== 'number') {
                LOG.error(`EventConsumerHTTP.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                continue;
            }

            switch (dataItem.key) {
                case EVENT.eEventKey.eHTTPDownload:
                case EVENT.eEventKey.eHTTPUpload: {
                    const audit: DBAPI.Audit = EventConsumerDB.convertDataToAudit(dataItem.value);
                    const oID: DBAPI.ObjectIDAndType = { idObject: audit.idDBObject ?? 0, eObjectType: audit.DBObjectType ?? 0 };

                    if (audit.idSystemObject === null && audit.idDBObject && audit.DBObjectType) {
                        const SOInfo: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
                        if (SOInfo)
                            audit.idSystemObject = SOInfo.idSystemObject;
                    }

                    if (audit.idAudit === 0)
                        audit.create(); // don't use await so this happens asynchronously
                    LOG.info(`EventConsumerHTTP.eventWorker ${EVENT.eEventKey[dataItem.key]} ${JSON.stringify(oID)} by idUser ${audit.idUser}`, LOG.LS.eEVENT);
                } break;

                default:
                    LOG.error(`EventConsumerHTTP.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                    break;
            }
        }
    }
}
