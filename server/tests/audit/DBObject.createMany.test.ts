import * as COMMON from '@dpo-packrat/common';
import { DBObject } from '../../db/connection/DBObject';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { eEventKey } from '../../event/interface/EventEnums';
import { DBObjectNameToType } from '../../db/api/ObjectType';

// Minimal DBObject subclass that stubs its workers and reports a valid ObjectType
// so createMany() exercises the audit-key path without touching the DB.
type FakeInput = { id: number };
class FakeDBObject extends DBObject<FakeInput> {
    public id: number = 0;
    fetchTableName(): string { return 'Scene'; }
    fetchID(): number { return this.id; }
    protected async createWorker(): Promise<boolean> { return true; }
    protected async updateWorker(): Promise<boolean> { return true; }
    protected static async createManyWorker<T>(_data: DBObject<T>[]): Promise<boolean> { return true; }
}

describe('DBObject.createMany audit key', () => {
    test('emits eDBCreate for each item', async () => {
        // Confirm our fake resolves to a real object type (not eUnknown).
        expect(DBObjectNameToType('Scene')).toBe(COMMON.eSystemObjectType.eScene);

        const spy = jest.spyOn(AuditFactory, 'audit').mockResolvedValue(true);
        try {
            const items = [new FakeDBObject({ id: 1 }), new FakeDBObject({ id: 2 })];
            // Invoke the static createMany via the subclass so createManyWorker resolves correctly.
            const ok = await (FakeDBObject as unknown as { createMany: (d: FakeDBObject[]) => Promise<boolean> })
                .createMany(items);
            expect(ok).toBe(true);

            // Allow the fire-and-forget audit() calls to settle.
            await new Promise(resolve => setImmediate(resolve));

            expect(spy).toHaveBeenCalledTimes(2);
            for (const call of spy.mock.calls)
                expect(call[2]).toBe(eEventKey.eDBCreate);
        } finally {
            spy.mockRestore();
        }
    });
});
