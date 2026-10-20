import * as DBAPI from '../../../db';
import * as COL from '../../../collections/interface/';
import * as COMMON from '@dpo-packrat/common';
import * as UTIL from '../api';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

afterAll(async done => {
    done();
});

// *******************************************************************
// DB Composite SubjectUnitIdentifier
// *******************************************************************
// The DB-only fetch/search tests self-seed the rows they assert: a populated unit
// with many identically-tokenized subjects (enough rows to exercise multi-page
// search) plus a second empty unit to prove the idUnit filter. The search token is
// unique per run, so results are not tied to any particular database catalog and are
// immune to the rows that accumulate in the shared Packrat_test schema.
//
// The ICollection.queryCollection tests reach the live EDAN service, so they are
// opt-in (skipped by default): off-network they return 0 records and would fail, and
// mixing live EDAN into the DB assertions can mask a DB regression. Those legitimately
// query EDAN's real-world holdings (e.g. 'Armstrong'), which are not the local DB seed.
// Enable with PACKRAT_TEST_EDAN=1.
const edanTestsEnabled: boolean = process.env.PACKRAT_TEST_EDAN === '1';
// SKIP_REASON: live EDAN network; opt-in via PACKRAT_TEST_EDAN=1 (the DB-only path always runs).
const testEdan = edanTestsEnabled ? test : test.skip;

const SEEDED_SUBJECTS: number = 15;

describe('DB Composite SubjectUnitIdentifier Test', () => {
    jest.setTimeout(120000);
    const ICollection: COL.ICollection = COL.CollectionFactory.getInstance();

    // Populated at seed time, read inside each test body (which runs after beforeAll).
    let token: string = '';
    let idUnitWith: number = 0;      // unit that owns the seeded subjects
    let idUnitWithout: number = 0;   // unit with no subjects — proves the idUnit filter

    beforeAll(async () => {
        token = UTIL.randomStorageKey('SUIT');

        const unitWith: DBAPI.Unit = await UTIL.createUnitTest({ Name: `SUIT Unit With ${token}`, Abbreviation: 'SUITW', ARKPrefix: 'http://suit/', idUnit: 0 });
        const unitWithout: DBAPI.Unit = await UTIL.createUnitTest({ Name: `SUIT Unit Without ${token}`, Abbreviation: 'SUITX', ARKPrefix: 'http://suit/', idUnit: 0 });
        idUnitWith = unitWith.idUnit;
        idUnitWithout = unitWithout.idUnit;

        // Each subject carries the token in both its name and its identifier, so the
        // search matches regardless of which field it targets.
        for (let i = 0; i < SEEDED_SUBJECTS; i++) {
            await UTIL.createSubjectWithIdentifierTest(
                { idUnit: idUnitWith, idAssetThumbnail: null, idGeoLocation: null, Name: `SUIT Subject ${token} ${i}`, idIdentifierPreferred: null, idSubject: 0 },
                `${token}-${i}`
            );
        }
    });

    // --- DB-only fetch (always runs) ---------------------------------------------

    test('DB Composite SubjectUnitIdentifier.fetch \'<seeded token>\'', async () => {
        const results: DBAPI.SubjectUnitIdentifier[] | null = await DBAPI.SubjectUnitIdentifier.fetch(token, 10);
        expect(results).toBeTruthy();
        if (results)
            expect(results.length).toBeGreaterThan(0);
    });

    test('DB Composite SubjectUnitIdentifier.fetch \'\' (empty query)', async () => {
        const results: DBAPI.SubjectUnitIdentifier[] | null = await DBAPI.SubjectUnitIdentifier.fetch('', 10);
        expect(results).toBeFalsy();
    });

    test('DB Composite SubjectUnitIdentifier.fetch SQL-injection string is handled', async () => {
        const results: DBAPI.SubjectUnitIdentifier[] | null = await DBAPI.SubjectUnitIdentifier.fetch('1 = 1; DROP Database Packrat', 10);
        expect(results).toBeTruthy();
        if (results)
            expect(results.length).toBe(0);
    });

    // --- DB-only search (always runs) --------------------------------------------

    searchCase('search \'\' returns results', () => ({ query: '' }), true);
    searchCase('search \'<token>\' returns the seeded subjects', () => ({ query: token }), true);
    searchCase('search \'<token>\' scoped to the populated unit', () => ({ query: token, idUnit: idUnitWith }), true);
    searchCase('search \'<token>\' scoped to the empty unit returns nothing', () => ({ query: token, idUnit: idUnitWithout }), false);
    searchCase('search \'<token>\' with an invalid idUnit returns nothing', () => ({ query: token, idUnit: -1 }), false);
    searchCase('search \'<token>\' page 1 of 100', () => ({ query: token, idUnit: idUnitWith, page: 1, row: 100 }), true);
    searchCase('search \'<token>\' page 2 of 10 (second page populated)', () => ({ query: token, idUnit: idUnitWith, page: 2, row: 10 }), true);
    searchCase('search \'<token>\' sorted by default', () => ({ query: token, idUnit: idUnitWith, page: 2, row: 10, sortBy: COMMON.eSubjectUnitIdentifierSortColumns.eDefault, sortDir: true }), true);
    searchCase('search \'<token>\' sorted by identifier value', () => ({ query: token, idUnit: idUnitWith, page: 2, row: 10, sortBy: COMMON.eSubjectUnitIdentifierSortColumns.eIdentifierValue, sortDir: false }), true);
    searchCase('search \'<token>\' sorted by subject name', () => ({ query: token, idUnit: idUnitWith, page: 2, row: 10, sortBy: COMMON.eSubjectUnitIdentifierSortColumns.eSubjectName, sortDir: true }), true);
    searchCase('search \'<token>\' sorted by unit abbreviation', () => ({ query: token, idUnit: idUnitWith, page: 2, row: 10, sortBy: COMMON.eSubjectUnitIdentifierSortColumns.eUnitAbbreviation, sortDir: false }), true);

    // --- live EDAN (opt-in; queries EDAN's holdings, not the local DB seed) -------

    executeQueryCollection(ICollection, 'Mount', false, true);
    executeQueryCollection(ICollection, 'DPO', false, true);
    executeQueryCollection(ICollection, 'Armstrong', false, true);
    executeQueryCollection(ICollection, '', false, true);

    testEdan('queryCollection rejects or escapes SQL injection', async () => {
        const query = '1 = 1; DROP DATABASE Packrat';
        const result = await ICollection.queryCollection(query, 10, 0, null);
        expect(result === null || result.records.length === 0).toBe(true);
    });

    // A search case whose dynamic args are read at run time (after beforeAll seeds).
    function searchCase(label: string, getArgs: () => { query: string; idUnit?: number; page?: number; row?: number; sortBy?: COMMON.eSubjectUnitIdentifierSortColumns; sortDir?: boolean }, expectResults: boolean): void {
        test(`DB Composite SubjectUnitIdentifier.search ${label}`, async () => {
            const a = getArgs();
            const results: DBAPI.SubjectUnitIdentifier[] | null = await DBAPI.SubjectUnitIdentifier.search(a.query, a.idUnit, a.page, a.row, a.sortBy, a.sortDir);
            RK.logInfo(RK.LogSection.eTEST, 'execute search', `result count=${results?.length}`, {}, 'Tests.DB.SubjectIdentifier');
            expect(results).toBeTruthy();
            if (results) {
                if (expectResults)
                    expect(results.length).toBeGreaterThan(0);
                else
                    expect(results.length).toBe(0);
            }
        });
    }
});

function executeQueryCollection(ICollection: COL.ICollection, query: string, expectNull: boolean, expectResults: boolean): void {
    testEdan(`DB Composite SubjectUnitIdentifier.fetch and ICollection.queryCollection '${query}'`, async () => {
        let resultsDB: DBAPI.SubjectUnitIdentifier[] | null = await DBAPI.SubjectUnitIdentifier.fetch(query, 10);
        const resultsCOL: COL.CollectionQueryResults | null = await ICollection.queryCollection(query, 10, 0, null);

        // Combine Results
        if (!resultsDB)
            resultsDB = [];
        if (resultsCOL && resultsCOL.records)
            for (const record of resultsCOL.records)
                resultsDB.push({
                    idSubject: 0,
                    idSystemObject: 0,
                    SubjectName: record.name,
                    UnitAbbreviation: record.unit,
                    IdentifierPublic: record.identifierPublic,
                    IdentifierCollection: record.identifierCollection,
                    idUnit: 0
                });

        if (!expectNull)
            expect(resultsDB).toBeTruthy();
        else
            expect(resultsDB).toBeFalsy();

        if (resultsDB) {
            if (expectResults)
                expect(resultsDB.length).toBeGreaterThan(0);
            else
                expect(resultsDB.length).toBe(0);
        }
    });
}
