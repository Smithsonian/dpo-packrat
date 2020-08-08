import * as DBAPI from '../../../db';
// import * as LOG from '../../../utils/logger';

afterAll(async done => {
    done();
});

// *******************************************************************
// DB Composite SubjectUnitIdentifier
// *******************************************************************
describe('DB Composite IngestionSubjectProjectAlgo Test', () => {
    executeAlgorithm([1]);
    executeAlgorithm([1, 2]);
    executeAlgorithm([]);

    executeMultistageQuery([1], false);
    executeMultistageQuery([1, 2], false);
    executeMultistageQuery([], true);
});

function executeAlgorithm(subjectIDs: number[]): void {
    test(`DB Composite IngestionSubjectProjectAlgo Test 1 '${JSON.stringify(subjectIDs)}'`, async () => {
        let results: DBAPI.Project[] | null = null;
        results = await DBAPI.Project.fetchFromSubjects(subjectIDs);
        if (results && results.length > 0)
            return;

        results = await DBAPI.Project.fetchFromSubjectsUnits(subjectIDs);
        if (results && results.length > 0)
            return;

        results = await DBAPI.Project.fetchAll();
        expect(results).toBeTruthy();
    });
}

function executeMultistageQuery(subjectIDs: number[], expectNull: boolean): void {
    test(`DB Composite IngestionSubjectProjectAlgo Test 2 '${JSON.stringify(subjectIDs)}'`, async () => {
        let results: DBAPI.Project[] | null = null;
        results = await DBAPI.Project.fetchFromSubjects(subjectIDs);
        // LOG.logger.info('Step 1:' + JSON.stringify(results));
        if (!expectNull)
            expect(results).toBeTruthy();
        else
            expect(results).toBeFalsy();

        results = await DBAPI.Project.fetchFromSubjectsUnits(subjectIDs);
        // LOG.logger.info('Step 2:' + JSON.stringify(results));
        if (!expectNull)
            expect(results).toBeTruthy();
        else
            expect(results).toBeFalsy();

        results = await DBAPI.Project.fetchAll();
        // LOG.logger.info('Step 3:' + JSON.stringify(results));
        expect(results).toBeTruthy();
    });
}
