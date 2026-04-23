import * as COMMON from '@dpo-packrat/common';
import { AuditEventGenerator } from '../../audit/impl/AuditEventGenerator';
import { eAuditType, ObjectIDAndType } from '../../db/api/ObjectType';
import { eEventKey, eEventTopic } from '../../event/interface/EventEnums';
import { IEventEngine, IEventData } from '../../event/interface/IEventEngine';
import { IEventProducer } from '../../event/interface/IEventProducer';
import { IEventConsumer } from '../../event/interface/IEventConsumer';
import { IOResults } from '../../records/recordKeeper';
import { Audit } from '@prisma/client';

type CapturedEvent = { topic: eEventTopic; key: eEventKey; value: Audit };

class StubProducer implements IEventProducer {
    public captured: CapturedEvent[] = [];
    async send<Key, Value>(topic: eEventTopic, data: IEventData<Key, Value>[]): Promise<void> {
        for (const d of data)
            this.captured.push({ topic, key: d.key as unknown as eEventKey, value: d.value as unknown as Audit });
    }
}

class StubEngine implements IEventEngine {
    constructor(public producer: StubProducer) {}
    async initialize(): Promise<IOResults> { return { success: true, message: '' }; }
    async createProducer(): Promise<IEventProducer | null> { return this.producer; }
    async createConsumer(_eTopic?: eEventTopic): Promise<IEventConsumer | null> { return null; }
}

describe('AuditEventGenerator eEventKey → eAuditType mapping', () => {
    const oID: ObjectIDAndType = { idObject: 1, eObjectType: COMMON.eSystemObjectType.eScene };

    const cases: Array<[eEventKey, eAuditType]> = [
        [eEventKey.eDBCreate,     eAuditType.eDBCreate],
        [eEventKey.eDBUpdate,     eAuditType.eDBUpdate],
        [eEventKey.eDBDelete,     eAuditType.eDBDelete],
        [eEventKey.eAuthLogin,    eAuditType.eAuthLogin],
        [eEventKey.eAuthFailed,   eAuditType.eAuthFailed],
        [eEventKey.eSceneQCd,     eAuditType.eSceneQCd],
        [eEventKey.eHTTPDownload, eAuditType.eHTTPDownload],
        [eEventKey.eHTTPUpload,   eAuditType.eHTTPUpload],
        [eEventKey.eSolrRebuild,  eAuditType.eSolrRebuild],
        [eEventKey.eGenDownloads, eAuditType.eGenDownloads], // Phase 1 / I.1: previously fell through to eDBUpdate
    ];

    test.each(cases)('maps %s to expected eAuditType', async (key, expectedAuditType) => {
        const producer = new StubProducer();
        const engine = new StubEngine(producer);
        AuditEventGenerator.setEventEngine(engine);
        // Force fresh producer acquisition by bypassing the singleton's cached producer.
        (AuditEventGenerator.singleton as unknown as { eventProducer: IEventProducer | null }).eventProducer = null;

        const ok = await AuditEventGenerator.singleton.audit({ id: oID.idObject }, oID, key);
        expect(ok).toBe(true);
        expect(producer.captured.length).toBe(1);
        expect(producer.captured[0].value.AuditType).toBe(expectedAuditType);
    });
});
