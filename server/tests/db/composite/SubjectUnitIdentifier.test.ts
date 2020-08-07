import * as DBAPI from '../../../db';
import * as COL from '../../../collections/interface/';
import * as LOG from '../../../utils/logger';

afterAll(async done => {
    done();
});

// *******************************************************************
// DB Composite SubjectUnitIdentifier
// *******************************************************************
describe('DB Composite SubjectUnitIdentifier Test', () => {
    jest.setTimeout(30000);
    const ICollection: COL.ICollection = COL.CollectionFactory.getInstance();

    executeQuery('Mount', false, true);
    // executeQuery('DPO', false, true);
    // executeQuery('Armstrong', false, true);
    // executeQuery('', true, false);
    // executeQuery('1 = 1; DROP Database Packrat', false, false);

    executeQueryCollection(ICollection, 'Mount', false, true);
    executeQueryCollection(ICollection, 'DPO', false, true);
    // executeQueryCollection(ICollection, 'Armstrong', false, true);
    // executeQueryCollection(ICollection, '', true, false);
    // executeQueryCollection(ICollection, '1 = 1; DROP Database Packrat', false, false);
});

function executeQuery(query: string, expectNull: boolean, expectResults: boolean): void {
    test(`DB Composite SubjectUnitIdentifier.fetch '${query}'`, async () => {
        const results: DBAPI.SubjectUnitIdentifier[] | null = await DBAPI.SubjectUnitIdentifier.fetch(query);
        // LOG.logger.info(JSON.stringify(results));
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
        const resultsDB: DBAPI.SubjectUnitIdentifier[] | null = await DBAPI.SubjectUnitIdentifier.fetch(query);
        const resultsCOL: COL.CollectionQueryResults | null = await ICollection.queryCollection(query, 10, 0);
        resultsCOL;

        LOG.logger.info(query + '\n' + JSON.stringify(resultsDB) + '\n');
        LOG.logger.info(query + '\n' + JSON.stringify(resultsCOL) + '\n');

        // LOG.logger.info(JSON.stringify(results));
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
