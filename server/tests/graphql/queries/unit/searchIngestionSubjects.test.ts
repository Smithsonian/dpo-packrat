import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as COL from '../../../../collections/interface';

const searchIngestionSubjectsTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: searchIngestionSubjects', () => {
        // Restore only this spy — restoreAllMocks() would also drop the shared
        // admin-context mock TestSuiteUtils installs for the whole aggregator.
        let querySpy: jest.SpyInstance;
        afterEach(() => querySpy?.mockRestore());

        test('consults the EDAN collection and returns a merged list (EDAN mocked, no live call)', async () => {
            // The resolver merges DB results with an EDAN collection query. Mock
            // the EDAN call so the test is hermetic (no live network / Unauthorized
            // noise) and deterministic, while still exercising the merge path.
            querySpy = jest.spyOn(COL.CollectionFactory.getInstance(), 'queryCollection')
                .mockResolvedValue({ records: [], rowCount: 0 });

            const { SubjectUnitIdentifier } = await graphQLApi.searchIngestionSubjects({ query: 'apollo' });

            expect(querySpy).toHaveBeenCalled();
            expect(Array.isArray(SubjectUnitIdentifier)).toBe(true);
        });
    });
};

export default searchIngestionSubjectsTest;
