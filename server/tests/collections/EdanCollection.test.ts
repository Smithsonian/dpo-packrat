import * as COL from '../../collections/interface/';

afterAll(async done => {
    done();
});

describe('Collections: EdanCollection', () => {
    jest.setTimeout(30000);
    const ICollection: COL.ICollection = COL.CollectionFactory.getInstance();
    executeTestQuery(ICollection, 'Armstrong Space Suit', false);
    executeTestQuery(ICollection, 'A19730040000', false);
    executeTestQuery(ICollection, 'edanmdm:nasm_A19730040000', false);
    executeTestQuery(ICollection, 'http://n2t.net/ark:/65665/nv93248f8ce-b6c4-474d-aac7-88252a2daf73', false);
    executeTestQuery(ICollection, '', false);
    executeTestQuery(ICollection, 'jimmybobimmy', true);
    executeTestQuery(ICollection, '<WHACKADOODLE>', true);
    executeTestQuery(ICollection, 'nv93248f8ce-b6c4-474d-aac7-88252a2daf73', false);
});

function executeTestQuery(ICollection: COL.ICollection, query: string, expectNoResults: boolean): void {
    test('Collections: EdanCollection.queryCollection ' + query, async () => {
        const results: COL.CollectionQueryResults | null = await ICollection.queryCollection(query, 10, 0);

        expect(results).toBeTruthy();
        if (results) {
            expect(results.records).toBeTruthy();
            if (results.records) {
                expect(results.records.length).toBeLessThanOrEqual(results.rowCount);
                if (expectNoResults)
                    expect(results.records.length).toBe(0);
                else
                    expect(results.records.length).toBeGreaterThan(0);
            }
        }
    });
}
