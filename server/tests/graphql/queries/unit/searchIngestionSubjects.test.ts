import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const searchIngestionSubjectsTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: searchIngestionSubjects', () => {
        test('should work with valid input', async () => {
            const searchInput = {
                query: 'apollo'
            };

            const { SubjectUnitIdentifier } = await graphQLApi.searchIngestionSubjects(searchInput);
            expect(SubjectUnitIdentifier).toBeTruthy();
        });
    });
};

export default searchIngestionSubjectsTest;
