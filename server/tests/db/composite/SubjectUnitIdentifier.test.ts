import * as DBAPI from '../../../db';
import * as COL from '../../../collections/interface/';
import * as LOG from '../../../utils/logger';
import * as COMMON from '../../../../client/src/types/server';
// import * as H from '../../../utils/helpers';

afterAll(async done => {
    // awaitH.Helpers.sleep(4000);
    done();
});

// *******************************************************************
// DB Composite SubjectUnitIdentifier
// *******************************************************************
describe('DB Composite SubjectUnitIdentifier Test', () => {
    jest.setTimeout(60000);
    const ICollection: COL.ICollection = COL.CollectionFactory.getInstance();

    executeQuery('Mount', false, true);
    executeQuery('DPO', false, true);
    executeQuery('Armstrong', false, true);
    executeQuery('', true, false);
    executeQuery('1 = 1; DROP Database Packrat', false, false);

    executeQueryCollection(ICollection, 'Mount', false, true);
    executeQueryCollection(ICollection, 'DPO', false, true);
    executeQueryCollection(ICollection, 'Armstrong', false, true);
    executeQueryCollection(ICollection, '', false, true);
    executeQueryCollection(ICollection, '1 = 1; DROP Database Packrat', false, false);

    executeSearch('', false, true);
    executeSearch('Mount', false, true);
    executeSearch('Armstrong', false, true);
    executeSearch('Armstrong', false, true, 12);
    executeSearch('Armstrong', false, false, 1);
    executeSearch('65665', false, true);
    executeSearch('65665', false, false, -1);
    executeSearch('65665', false, true, 12, 1, 100);
    executeSearch('65665', false, true, 12, 2, 10);
    executeSearch('65665', false, true, 12, 2, 10, COMMON.eSubjectUnitIdentifierSortColumns.eDefault, true);
    executeSearch('65665', false, true, 12, 2, 10, COMMON.eSubjectUnitIdentifierSortColumns.eIdentifierValue, false);
    executeSearch('65665', false, true, 12, 2, 10, COMMON.eSubjectUnitIdentifierSortColumns.eSubjectName, true);
    executeSearch('65665', false, true, 12, 2, 10, COMMON.eSubjectUnitIdentifierSortColumns.eUnitAbbreviation, false);
});

function executeQuery(query: string, expectNull: boolean, expectResults: boolean): void {
    test(`DB Composite SubjectUnitIdentifier.fetch '${query}'`, async () => {
        const results: DBAPI.SubjectUnitIdentifier[] | null = await DBAPI.SubjectUnitIdentifier.fetch(query, 10);

        if (!expectNull)
            expect(results).toBeTruthy();
        else
            expect(results).toBeFalsy();

        if (results) {
            if (expectResults)
                expect(results.length).toBeGreaterThan(0);
            else
                expect(results.length).toBe(0);
        }
    });
}

function executeQueryCollection(ICollection: COL.ICollection, query: string, expectNull: boolean, expectResults: boolean): void {
    test(`DB Composite SubjectUnitIdentifier.fetch and ICollection.queryCollection '${query}'`, async () => {
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
                    IdentifierCollection: record.identifierCollection
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

function executeSearch(query: string, expectNull: boolean, expectResults: boolean,
    idUnit?: number | undefined, pageNumber?: number | undefined, rowCount?: number | undefined,
    sortBy?: COMMON.eSubjectUnitIdentifierSortColumns | undefined,
    sortDirection?: boolean | undefined): void {
    test(`DB Composite SubjectUnitIdentifier.search '${query}', ${idUnit}, ${pageNumber}, ${rowCount}, ${sortBy}, ${sortDirection}`, async () => {
        const results: DBAPI.SubjectUnitIdentifier[] | null = await DBAPI.SubjectUnitIdentifier.search(query, idUnit, pageNumber, rowCount, sortBy, sortDirection);
        LOG.info(`SubjectUnitIdentifier.search result count=${results?.length}`, LOG.LS.eTEST);

        if (!expectNull)
            expect(results).toBeTruthy();
        else
            expect(results).toBeFalsy();

        if (results) {
            if (expectResults)
                expect(results.length).toBeGreaterThan(0);
            else
                expect(results.length).toBe(0);
        }
    });
}
