import { GetVocabularyInput, GetVocabularyResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const getVocabularyTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getVocabulary', () => {
        test('should work with valid input', async () => {
            const input: GetVocabularyInput = {
                idVocabulary: 0
            };

            const { Vocabulary }: GetVocabularyResult = await graphQLApi.getVocabulary(input);

            if (Vocabulary) {
                expect(Vocabulary.idVocabulary).toBe(0);
            } else {
                expect(Vocabulary).toBe(null);
            }
        });
    });
};

export default getVocabularyTest;
