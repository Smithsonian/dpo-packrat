import * as EVENT from '../../interface';
import { EventConsumer } from './EventConsumer';
import { EventConsumerDB } from './EventConsumerDB';
import { EventEngine } from './EventEngine';
import * as COMMON from '@dpo-packrat/common';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

export class EventConsumerPublish extends EventConsumer {
    constructor(engine: EventEngine) {
        super(engine);
    }

    protected async eventWorker<Key, Value>(data: EVENT.IEventData<Key, Value>[]): Promise<void> {
        // inform audit interface of authentication event
        for (const dataItem of data) {
            if (typeof(dataItem.key) !== 'number') {
                RK.logError(RK.LogSection.eEVENT,'event worker failed','sent event with unknown key',{ ...dataItem },'Event.Consumer.Publish');
                continue;
            }

            switch (dataItem.key) {
                case EVENT.eEventKey.eSceneQCd:
                    if (!await this.publishScene(dataItem.value))
                        RK.logError(RK.LogSection.eEVENT,'event worker failed','failed publishing scene',{ ...dataItem },'Event.Consumer.Publish');
                    break;

                default:
                    RK.logError(RK.LogSection.eEVENT,'event worker failed','unsupported key',{ ...dataItem },'Event.Consumer.Publish');
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

        if (audit.idAudit === 0)
            audit.create(); // don't use await so this happens asynchronously

        if (!idSystemObject) {
            RK.logError(RK.LogSection.eEVENT,'publish scene failed','received eSceneQCd event for scene without idSystemObject',{ audit },'Event.Consumer.Publish');
            return false;
        }

        if (audit.getDBObjectType() !== COMMON.eSystemObjectType.eScene) {
            RK.logError(RK.LogSection.eEVENT,'publish scene failed','received eSceneQCd event for non scene object',{ audit },'Event.Consumer.Publish');
            return false;
        }

        RK.logInfo(RK.LogSection.eEVENT,'publish scene success',undefined,{ dataItemValue, idSystemObject },'Event.Consumer.Publish');
        return true;
    }
}
