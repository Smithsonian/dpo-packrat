import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createVocabularyTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Mutation: createVocabulary', () => {
        test('should work with valid input', async () => {
            const vocabularySetArgs = {
                Name: 'Test Vocabulary Set',
                SystemMaintained: false
            };

            const { VocabularySet } = await graphQLApi.createVocabularySet(vocabularySetArgs);
            expect(VocabularySet).toBeTruthy();

            if (VocabularySet) {
                const vocabularyArgs = {
                    idVocabularySet: VocabularySet.idVocabularySet,
                    SortOrder: 0,
                };

                const { Vocabulary } = await graphQLApi.createVocabulary(vocabularyArgs);
                expect(Vocabulary).toBeTruthy();
            }
        });
    });
};

export default createVocabularyTest;
