/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as EVENT from '../../event/interface';
import { eDBObjectType, ObjectIDAndType, SystemObjectInfo, eAuditType } from '../../db/api/ObjectType';
import { Audit } from '../../db/api/Audit';
import * as CACHE from '../../cache';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import { ASL, LocalStore } from '../../utils/localStore';

export class AuditEventGenerator {
    private eventEngine: EVENT.IEventEngine | null = null;
    private eventProducer: EVENT.IEventProducer | null = null;
    private constructor() { }

    public static singleton: AuditEventGenerator = new AuditEventGenerator();

    public async auditDBObject(dbObject: any, oID: ObjectIDAndType, key: EVENT.eEventKey): Promise<boolean> {
        dbObject;
        if (!this.eventProducer) {
            if (!this.eventEngine)
                this.eventEngine = await EVENT.EventFactory.getInstance();
            if (this.eventEngine)
                this.eventProducer = await this.eventEngine.createProducer();
            else {
                LOG.error('AuditEventGenerator.auditDBObject unable to fetch event engine instance', LOG.LS.eEVENT);
                return false;
            }
        }

        if (this.eventProducer) {
            const eventDate: Date = new Date();
            const LS: LocalStore | undefined = ASL.getStore();
            const idUser: number | null = LS?.idUser || null;

            const DBObjectType: eDBObjectType = oID.eObjectType;
            const idDBObject: number = oID.idObject;
            const SOInfo: SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);

            let AuditType: eAuditType = eAuditType.eDBUpdate;
            switch (key) {
                case EVENT.eEventKey.eDBCreate: AuditType = eAuditType.eDBCreate; break;
                case EVENT.eEventKey.eDBUpdate: AuditType = eAuditType.eDBUpdate; break;
                case EVENT.eEventKey.eDBDelete: AuditType = eAuditType.eDBDelete; break;
            }

            const value: Audit = new Audit({
                idUser,
                AuditDate: eventDate,
                AuditType,
                DBObjectType,
                idDBObject,
                idSystemObject: (SOInfo && SOInfo.idSystemObject) ? SOInfo.idSystemObject : null,
                Data: JSON.stringify(dbObject, H.Helpers.stringifyDatabaseRow),
                idAudit: 0
            });

            const data: EVENT.IEventData<EVENT.eEventKey, Audit> = {
                eventDate,
                key,
                value,
            };
            this.eventProducer.send(EVENT.eEventTopic.eDB, [data]);
            return true;
        } else {
            LOG.error('AuditEventGenerator.auditDBObject unable to fetch event producer', LOG.LS.eEVENT);
            return false;
        }

    }
}