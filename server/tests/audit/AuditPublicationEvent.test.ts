import * as DBC from '../../db/connection';
import * as DBAPI from '../../db';
import { eAuditType } from '../../db/api/ObjectType';

describe('Audit.fetchLatestPublicationEvent', () => {
    let findFirstSpy: jest.SpyInstance;

    beforeEach(() => {
        findFirstSpy = jest.spyOn(DBC.DBConnection.prisma.audit, 'findFirst');
    });

    afterEach(() => jest.restoreAllMocks());

    test('queries only publish/unpublish types, newest first, and returns the row', async () => {
        findFirstSpy.mockResolvedValueOnce({
            idAudit: 7,
            idUser: 1,
            AuditDate: new Date('2026-07-01T00:00:00Z'),
            AuditType: eAuditType.eActionUnpublish,
            DBObjectType: null,
            idDBObject: null,
            idSystemObject: 500,
            Data: '{"after":{"eState":0}}',
            SystemActor: null,
            CorrelationId: null,
        });

        const event = await DBAPI.Audit.fetchLatestPublicationEvent(500);

        expect(event).not.toBeNull();
        expect(event?.AuditType).toBe(eAuditType.eActionUnpublish);
        expect(event?.idAudit).toBe(7);

        const arg = findFirstSpy.mock.calls[0][0];
        expect(arg.where.idSystemObject).toBe(500);
        expect(arg.where.AuditType.in).toEqual([eAuditType.eActionPublish, eAuditType.eActionUnpublish]);
        // Newest first: AuditDate desc, tie-broken by idAudit desc.
        expect(arg.orderBy).toEqual([{ AuditDate: 'desc' }, { idAudit: 'desc' }]);
    });

    test('returns null when the object has no publication event', async () => {
        findFirstSpy.mockResolvedValueOnce(null);
        expect(await DBAPI.Audit.fetchLatestPublicationEvent(501)).toBeNull();
    });

    test('returns null on a falsy idSystemObject without hitting the DB', async () => {
        expect(await DBAPI.Audit.fetchLatestPublicationEvent(0)).toBeNull();
        expect(findFirstSpy).not.toHaveBeenCalled();
    });

    test('returns null (not throw) when the query errors', async () => {
        findFirstSpy.mockRejectedValueOnce(new Error('db down'));
        expect(await DBAPI.Audit.fetchLatestPublicationEvent(502)).toBeNull();
    });
});
