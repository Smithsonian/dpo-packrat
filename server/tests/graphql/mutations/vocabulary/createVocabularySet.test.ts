import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createVocabularySetTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Mutation: createVocabularySet', () => {
        test('should work with valid input', async () => {
            const vocabularySetArgs = {
                Name: 'Test Vocabulary Set',
                SystemMaintained: false
            };

            const { VocabularySet } = await graphQLApi.createVocabularySet(vocabularySetArgs);
            expect(VocabularySet).toBeTruthy();
        });
    });
};

export default createVocabularySetTest;
