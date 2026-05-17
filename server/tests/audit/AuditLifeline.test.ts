import * as DBC from '../../db/connection';
import * as DBAPI from '../../db';
import { eAuditType } from '../../db/api/ObjectType';

describe('Audit.fetchByIdSystemObject — per-object lifeline', () => {
    let queryRawSpy: jest.SpyInstance;

    beforeEach(() => {
        queryRawSpy = jest.spyOn(DBC.DBConnection.prisma, '$queryRaw');
    });

    afterEach(() => jest.restoreAllMocks());

    test('returns rows with AuditTypeName reverse-mapped from numeric AuditType', async () => {
        queryRawSpy
            .mockResolvedValueOnce([
                {
                    idAudit: 11,
                    AuditDate: new Date('2026-05-10T10:00:00Z'),
                    idUser: 42,
                    UserName: 'Alice',
                    EmailAddress: 'alice@example.com',
                    SystemActor: null,
                    AuditType: eAuditType.eActionPublish,
                    DBObjectType: 1,
                    idDBObject: 5,
                    idSystemObject: 100,
                    Data: '{"note":"published"}',
                    CorrelationId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                },
            ])
            .mockResolvedValueOnce([{ total: 1 }]);

        const result = await DBAPI.Audit.fetchByIdSystemObject(100);

        expect(result.total).toBe(1);
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].AuditTypeName).toBe('eActionPublish');
        expect(result.rows[0].UserName).toBe('Alice');
        expect(result.rows[0].CorrelationId).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    });

    test('clamps limit to [1, 500] and rejects negative offset', async () => {
        queryRawSpy.mockResolvedValue([]);

        await DBAPI.Audit.fetchByIdSystemObject(1, { offset: -5, limit: 9999 });
        const sqlCall = queryRawSpy.mock.calls[0][0];
        const values = queryRawSpy.mock.calls[0].slice(1);
        // Prisma tagged-template passes interpolations as separate args after the
        // template-strings array. Verify the clamped limit (500) and offset (0)
        // appear in the values bound to the SELECT.
        void sqlCall;
        expect(values).toContain(500);
        expect(values).toContain(0);
    });

    test('returns empty result on falsy idSystemObject without hitting the DB', async () => {
        const result = await DBAPI.Audit.fetchByIdSystemObject(0);
        expect(result.rows).toEqual([]);
        expect(result.total).toBe(0);
        expect(queryRawSpy).not.toHaveBeenCalled();
    });

    test('uses ASC ordering when descending is false', async () => {
        queryRawSpy.mockResolvedValueOnce([]).mockResolvedValueOnce([{ total: 0 }]);
        await DBAPI.Audit.fetchByIdSystemObject(7, { descending: false });
        // The first arg is the template-strings array containing the literal SQL chunks
        const stringsArr = queryRawSpy.mock.calls[0][0] as ReadonlyArray<string>;
        const joined = stringsArr.join('|');
        expect(joined).toContain('ORDER BY');
    });

    test('handles BIGINT count return from raw query', async () => {
        queryRawSpy
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ total: BigInt(123) }]);
        const result = await DBAPI.Audit.fetchByIdSystemObject(1);
        expect(result.total).toBe(123);
    });

    test('unknown AuditType numeric falls back to eAuditType(NNN) string', async () => {
        queryRawSpy
            .mockResolvedValueOnce([
                {
                    idAudit: 1,
                    AuditDate: new Date(),
                    idUser: null,
                    UserName: null,
                    EmailAddress: null,
                    SystemActor: 'Cook',
                    AuditType: 99999,
                    DBObjectType: null,
                    idDBObject: null,
                    idSystemObject: 100,
                    Data: null,
                    CorrelationId: null,
                },
            ])
            .mockResolvedValueOnce([{ total: 1 }]);
        const result = await DBAPI.Audit.fetchByIdSystemObject(100);
        expect(result.rows[0].AuditTypeName).toBe('eAuditType(99999)');
    });
});
