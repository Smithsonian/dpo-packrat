import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import { CreateVocabularySetInput } from '../../../../types/graphql';

const createVocabularySetTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createVocabularySetInput: () => CreateVocabularySetInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createVocabularySetInput = utils.createVocabularySetInput;
    });

    describe('Mutation: createVocabularySet', () => {
        test('should work with valid input', async () => {
            const vocabularySetArgs: CreateVocabularySetInput = createVocabularySetInput();
            const { VocabularySet } = await graphQLApi.createVocabularySet(vocabularySetArgs);
            expect(VocabularySet).toBeTruthy();
        });
    });
};

export default createVocabularySetTest;
