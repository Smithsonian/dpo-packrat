import * as DBAPI from '../../../db';

afterAll(async done => {
    done();
});

// *******************************************************************
// DB Composite: Project.fetchRelatedToSubjects (subject -> project algorithm)
// *******************************************************************
describe('DB Composite IngestionSubjectProjectAlgo Test', () => {
    executeAlgorithm([1]);
    executeAlgorithm([1, 2]);
    executeAlgorithm([]);
});

// Asserts the real contract of Project.fetchRelatedToSubjects rather than
// short-circuiting on any non-empty result:
//  - empty input returns null (by contract);
//  - a non-empty input returns an array of VALID projects, each of which also
//    exists in fetchAll() (related projects are a subset of all projects).
// This catches a query that returns garbage/non-existent projects, which the
// previous "return early if length > 0" version could not.
function executeAlgorithm(subjectIDs: number[]): void {
    test(`DB Composite IngestionSubjectProjectAlgo '${JSON.stringify(subjectIDs)}'`, async () => {
        const related: DBAPI.Project[] | null = await DBAPI.Project.fetchRelatedToSubjects(subjectIDs);

        if (subjectIDs.length === 0) {
            expect(related).toBeNull(); // empty input short-circuits to null by contract
            return;
        }

        // Non-empty input: an array (possibly empty) of real projects.
        expect(related).toBeTruthy();

        const all: DBAPI.Project[] | null = await DBAPI.Project.fetchAll();
        expect(all).toBeTruthy();
        const allProjectIDs: Set<number> = new Set((all ?? []).map(p => p.idProject));

        for (const project of related ?? []) {
            expect(project.idProject).toBeGreaterThan(0);
            expect(project.Name).toBeTruthy();
            expect(allProjectIDs.has(project.idProject)).toBe(true); // related ⊆ all
        }
    });
}
