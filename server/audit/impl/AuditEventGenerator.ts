/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as EVENT from '../../event/interface';

import { eDBObjectType, eSystemObjectType, ObjectIDAndType, DBObjectTypeToName, eAuditType } from '../../db/api/ObjectType';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import { ASL, LocalStore } from '../../utils/localStore';
import { Audit } from '@prisma/client';

//** Audit.idSystemObject is not populated here, to avoid using CACHE.SystemObjectCache */
export class AuditEventGenerator {
    static setEventEngine(eventEngine: EVENT.IEventEngine): void {
        LOG.info('AuditEventGenerator.setEventEngine called', LOG.LS.eAUDIT);
        AuditEventGenerator.eventEngine = eventEngine;
    }
    private static eventEngine: EVENT.IEventEngine | null = null;   // don't import EventFactory to avoid circular dependencies
    private eventProducer: EVENT.IEventProducer | null = null;
    private constructor() { }

    public static singleton: AuditEventGenerator = new AuditEventGenerator();

    public async audit(obj: any, oID: ObjectIDAndType, key: EVENT.eEventKey): Promise<boolean> {
        const oIDRep: string = ((oID.eObjectType !== eSystemObjectType.eUnknown) || (oID.idObject !== 0))
            ? ` {${DBObjectTypeToName(oID.eObjectType)}, id: ${oID.idObject}}` : '';
        LOG.info(`AuditEventGenerator.audit${oIDRep}: ${EVENT.eEventKey[key]}`, LOG.LS.eAUDIT);
        if (!this.eventProducer) {
            if (AuditEventGenerator.eventEngine)
                this.eventProducer = await AuditEventGenerator.eventEngine.createProducer();
            else
                return true; // LOG.error(`AuditEventGenerator.audit unable to fetch event engine instance: ${JSON.stringify(oID)}-${EVENT.eEventKey[key]}\n${JSON.stringify(dbObject, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eEVENT);
        }

        if (this.eventProducer) {
            const eventDate: Date = new Date();
            const LS: LocalStore = ASL.getOrCreateStore();
            const idUser: number | null = LS?.idUser || null;

            const DBObjectType: eDBObjectType = oID.eObjectType;
            const idDBObject: number = oID.idObject;

            let AuditType: eAuditType = eAuditType.eDBUpdate;
            let eventTopic: EVENT.eEventTopic = EVENT.eEventTopic.eDB;
            switch (key) {
                case EVENT.eEventKey.eDBCreate: AuditType = eAuditType.eDBCreate; break;
                case EVENT.eEventKey.eDBUpdate: AuditType = eAuditType.eDBUpdate; break;
                case EVENT.eEventKey.eDBDelete: AuditType = eAuditType.eDBDelete; break;
                case EVENT.eEventKey.eAuthLogin: AuditType = eAuditType.eAuthLogin; eventTopic = EVENT.eEventTopic.eAuth; break;
                case EVENT.eEventKey.eSceneQCd: AuditType = eAuditType.eSceneQCd; eventTopic = EVENT.eEventTopic.eDB; break;
            }

            const value: Audit = {
                idUser,
                AuditDate: eventDate,
                AuditType,
                DBObjectType,
                idDBObject,
                idSystemObject: null, // avoid computing with (await CACHE.SystemObjectCache.getSystemFromObjectID(oID))?.idSystemObject ?? null,
                Data: JSON.stringify(obj, H.Helpers.stringifyDatabaseRow),
                idAudit: 0
            };

            const data: EVENT.IEventData<EVENT.eEventKey, Audit> = {
                eventDate,
                key,
                value,
            };
            this.eventProducer.send(eventTopic, [data]);
            return true;
        } else {
            LOG.error('AuditEventGenerator.audit unable to fetch event producer', LOG.LS.eEVENT);
            return false;
        }

    }
}