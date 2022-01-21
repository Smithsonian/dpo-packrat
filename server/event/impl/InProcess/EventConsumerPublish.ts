import * as EVENT from '../../interface';
import { EventConsumer } from './EventConsumer';
import { EventConsumerDB } from './EventConsumerDB';
import { EventEngine } from './EventEngine';
import * as COMMON from '../../../../client/src/types/server';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';

export class EventConsumerPublish extends EventConsumer {
    constructor(engine: EventEngine) {
        super(engine);
    }

    protected async eventWorker<Key, Value>(data: EVENT.IEventData<Key, Value>[]): Promise<void> {
        // inform audit interface of authentication event
        for (const dataItem of data) {
            if (typeof(dataItem.key) !== 'number') {
                LOG.error(`EventConsumerPublish.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                continue;
            }

            switch (dataItem.key) {
                case EVENT.eEventKey.eSceneQCd:
                    if (!await this.publishScene(dataItem.value))
                        LOG.error('EventConsumerPublish.eventWorker failed publishing scene', LOG.LS.eEVENT);
                    break;

                default:
                    LOG.error(`EventConsumerPublish.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                    break;
            }
        }
    }

    protected async publishScene<Value>(dataItemValue: Value): Promise<boolean> {
        const audit: DBAPI.Audit = EventConsumerDB.convertDataToAudit(dataItemValue);

        let idSystemObject: number | null = audit.idSystemObject;
        if (idSystemObject === null && audit.idDBObject && audit.DBObjectType) {
            const oID: DBAPI.ObjectIDAndType = { idObject: audit.idDBObject, eObjectType: audit.DBObjectType };
            const SOInfo: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
            if (SOInfo) {
                idSystemObject = SOInfo.idSystemObject;
                audit.idSystemObject = idSystemObject;
            }
        }

        LOG.info(`EventConsumerPublish.publishScene Scene QCd ${audit.idDBObject}`, LOG.LS.eEVENT);
        if (audit.idAudit === 0)
            audit.create(); // don't use await so this happens asynchronously

        if (!idSystemObject) {
            LOG.error(`EventConsumerPublish.publishScene received eSceneQCd event for scene without idSystemObject ${JSON.stringify(audit, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
            return false;
        }

        if (audit.getDBObjectType() !== COMMON.eSystemObjectType.eScene) {
            LOG.error(`EventConsumerPublish.publishScene received eSceneQCd event for non scene object ${JSON.stringify(audit, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
            return false;
        }

        return true;
    }
}
