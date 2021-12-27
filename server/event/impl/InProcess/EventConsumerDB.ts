/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */
import * as EVENT from '../../interface';
import { EventConsumer } from './EventConsumer';
import { EventEngine } from './EventEngine';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as NAV from '../../../navigation/interface';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
import { eAuditType } from '../../../db';

export class EventConsumerDB extends EventConsumer {
    constructor(engine: EventEngine) {
        super(engine);
    }

    protected async eventWorker<Key, Value>(data: EVENT.IEventData<Key, Value>[]): Promise<void> {
        // inform audit interface of db event
        // inform cache and solr of systemobject events
        for (const dataItem of data) {
            if (typeof(dataItem.key) !== 'number') {
                LOG.error(`EventConsumerDB.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                continue;
            }
            // LOG.info(`EventConsumerDB.eventWorker ${JSON.stringify(dataItem, H.Helpers.stringifyDatabaseRow)}`, LOG.LS.eEVENT);

            switch (dataItem.key) {
                case EVENT.eEventKey.eDBCreate:
                case EVENT.eEventKey.eDBUpdate:
                case EVENT.eEventKey.eDBDelete: {
                    const audit: DBAPI.Audit = EventConsumerDB.convertDataToAudit(dataItem.value);

                    let idSystemObject: number | null = audit.idSystemObject;
                    if (idSystemObject === null && audit.idDBObject && audit.DBObjectType) {
                        const oID: DBAPI.ObjectIDAndType = { idObject: audit.idDBObject , eObjectType: audit.DBObjectType };
                        const SOInfo: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
                        if (SOInfo) {
                            idSystemObject = SOInfo.idSystemObject;
                            audit.idSystemObject = idSystemObject;
                        }
                    }

                    // index modified system objects
                    // in the event that the audit event is for a SystemObjectXref record, we reindex the "derived" object
                    if (idSystemObject) {
                        await CACHE.SystemObjectCache.flushObject(idSystemObject);        // don't use await so this happens asynchronously
                        NAV.NavigationFactory.scheduleObjectIndexing(idSystemObject);
                    } else if (audit.idDBObject) {
                        switch (audit.getDBObjectType()) {
                            case DBAPI.eNonSystemObjectType.eSystemObjectXref: {
                                const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.fetch(audit.idDBObject);
                                // LOG.info(`EventConsumerDB.eventWorker (${JSON.stringify(dataItem)}) updating xref ${JSON.stringify(xref, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
                                if (xref)
                                    NAV.NavigationFactory.scheduleObjectIndexing(xref.idSystemObjectDerived);
                            }
                        }
                    }
                    if (audit.idAudit === 0)
                        audit.create();                                             // don't use await so this happens asynchronously
                } break;

                default:
                    LOG.error(`EventConsumerDB.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                    break;
            }
        }
    }

    /*
    private static async fetchIndexer(): Promise<NAV.IIndexer | null> {
        const nav: NAV.INavigation | null = await NAV.NavigationFactory.getInstance();
        if (!nav) {
            LOG.error('EventConsumerDB.fetchIndexer unable to fetch INavigation', LOG.LS.eEVENT);
            return null;
        }

        return await nav.getIndexer();
    }
    */

    static convertDataToAudit(data: any): DBAPI.Audit {
        const idUser: number | null = H.Helpers.safeNumber(data.idUser);
        const AuditDate: Date = H.Helpers.safeDate(data.AuditDate) || new Date();
        const AuditType: number | null = H.Helpers.safeNumber(data.AuditType) || eAuditType.eUnknown;
        const DBObjectType: number | null = H.Helpers.safeNumber(data.DBObjectType) || null;
        const idDBObject: number | null = H.Helpers.safeNumber(data.idDBObject) || null;
        const idSystemObject: number | null = H.Helpers.safeNumber(data.idSystemObject) || null;
        const Data: string | null = H.Helpers.safeString(data.Data);
        const idAudit: number | null = H.Helpers.safeNumber(data.idAudit) || 0;
        return new DBAPI.Audit({ idUser, AuditDate, AuditType, DBObjectType, idDBObject, idSystemObject, Data, idAudit });
    }
}
