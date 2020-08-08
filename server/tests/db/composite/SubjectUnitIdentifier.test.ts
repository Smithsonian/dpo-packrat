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
    executeQuery('DPO', false, true);
    executeQuery('Armstrong', false, true);
    executeQuery('', true, false);
    executeQuery('1 = 1; DROP Database Packrat', false, false);

    executeQueryCollection(ICollection, 'Mount', false, true);
    executeQueryCollection(ICollection, 'DPO', false, true);
    executeQueryCollection(ICollection, 'Armstrong', false, true);
    executeQueryCollection(ICollection, '', false, true);
    executeQueryCollection(ICollection, '1 = 1; DROP Database Packrat', false, false);
});

function executeQuery(query: string, expectNull: boolean, expectResults: boolean): void {
    test(`DB Composite SubjectUnitIdentifier.fetch '${query}'`, async () => {
        const results: DBAPI.SubjectUnitIdentifier[] | null = await DBAPI.SubjectUnitIdentifier.fetch(query, 10);
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
        let resultsDB: DBAPI.SubjectUnitIdentifier[] | null = await DBAPI.SubjectUnitIdentifier.fetch(query, 10);
        const resultsCOL: COL.CollectionQueryResults | null = await ICollection.queryCollection(query, 10, 0);

        // Combine Results
        if (!resultsDB)
            resultsDB = [];
        if (resultsCOL && resultsCOL.records)
            for (const record of resultsCOL.records)
                resultsDB.push({
                    idSubject: 0,
                    SubjectName: record.name,
                    UnitAbbreviation: record.unit,
                    IdentifierPublic: record.identifierPublic,
                    IdentifierCollection: record.identifierCollection
                });

        LOG.logger.info(query + '\n');
        for (const record of resultsDB)
            LOG.logger.info(JSON.stringify(record));

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
