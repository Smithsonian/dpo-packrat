import * as EVENT from '../../interface';
import { EventConsumer } from './EventConsumer';
import { EventConsumerDB } from './EventConsumerDB';
import * as COMMON from '@dpo-packrat/common';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';

export class EventConsumerPublish extends EventConsumer {
    constructor(engine: EVENT.IEventEngine) {
        super(engine);
    }

    protected async eventWorker<Value>(data: EVENT.IEventData<Value>[]): Promise<void> {
        // inform audit interface of publishing event
        for (const dataItem of data) {
            if (typeof(dataItem.key) !== 'number') {
                LOG.error(`EventConsumerPublish.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                continue;
            }

            switch (dataItem.key) {
                case EVENT.eEventKey.ePubSceneQCd:
                    if (!await this.sceneQCd(dataItem.value))
                        LOG.error('EventConsumerPublish.eventWorker failed publishing scene', LOG.LS.eEVENT);
                    break;

                default:
                    LOG.error(`EventConsumerPublish.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                    break;
            }
        }
    }

    protected async sceneQCd<Value>(dataItemValue: Value): Promise<boolean> {
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

        LOG.info(`EventConsumerPublish.sceneQCd ${audit.idDBObject}`, LOG.LS.eEVENT);
        if (audit.idAudit === 0)
            audit.create(); // don't use await so this happens asynchronously

        if (!idSystemObject) {
            LOG.error(`EventConsumerPublish.sceneQCd received ePubSceneQCd event for scene without idSystemObject ${JSON.stringify(audit, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
            return false;
        }

        if (audit.getDBObjectType() !== COMMON.eSystemObjectType.eScene) {
            LOG.error(`EventConsumerPublish.sceneQCd received ePubSceneQCd event for non scene object ${JSON.stringify(audit, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
            return false;
        }

        return true;
    }
}
