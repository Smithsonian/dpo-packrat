import * as COMMON from '@dpo-packrat/common';
import * as UTIL from '../db/api';
import * as DBC from '../../db/connection';

// A DB-CRUD mutation run inside the test harness must attribute its audit row to the
// seeded test Actor (JestTest), never to the system:Unknown fallback. jest's
// ASL.enterWith does not reliably survive the async hops Prisma's $transaction
// introduces, so the mutation's store can arrive without its Actor; the harness-seeded
// ambient Actor stands in. This guards that attribution end-to-end: create a row, read
// back its persisted audit row, and assert the committed actor columns.
describe('Audit: test Actor attribution', () => {
    test('an audited create is attributed to JestTest, not system:Unknown', async () => {
        const unit = await UTIL.createUnitTest({ Name: 'Audit Actor Test', Abbreviation: 'AAT', ARKPrefix: 'http://aat/', idUnit: 0 });
        expect(unit.idUnit).toBeGreaterThan(0);

        const rows = await DBC.DBConnection.prisma.audit.findMany({
            where: { idDBObject: unit.idUnit, DBObjectType: COMMON.eSystemObjectType.eUnit },
            orderBy: { idAudit: 'desc' },
            take: 1,
        });
        expect(rows.length).toBe(1);
        // Actor.system('JestTest') persists as { idUser: null, SystemActor: 'JestTest' }.
        expect(rows[0].SystemActor).toBe('JestTest');
        expect(rows[0].idUser).toBeNull();
    });
});
