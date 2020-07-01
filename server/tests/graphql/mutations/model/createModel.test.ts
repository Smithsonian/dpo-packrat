import { CreateModelInput, CreateVocabularyInput, CreateVocabularySetInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createModelTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createVocabularyInput: (idVocabularySet: number) => CreateVocabularyInput;
    let createVocabularySetInput: () => CreateVocabularySetInput;
    let createModelInput: (idVocabularySet: number) => CreateModelInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createVocabularyInput = utils.createVocabularyInput;
        createVocabularySetInput = utils.createVocabularySetInput;
        createModelInput = utils.createModelInput;
    });

    describe('Mutation: createModel', () => {
        test('should work with valid input', async () => {
            const vocabularySetArgs: CreateVocabularySetInput = createVocabularySetInput();
            const { VocabularySet } = await graphQLApi.createVocabularySet(vocabularySetArgs);
            expect(VocabularySet).toBeTruthy();

            if (VocabularySet) {
                const vocabularyArgs: CreateVocabularyInput = createVocabularyInput(VocabularySet.idVocabularySet);
                const { Vocabulary } = await graphQLApi.createVocabulary(vocabularyArgs);
                expect(Vocabulary).toBeTruthy();

                if (Vocabulary) {
                    const modelArgs: CreateModelInput = createModelInput(Vocabulary.idVocabulary);
                    const { Model } = await graphQLApi.createModel(modelArgs);
                    expect(Model).toBeTruthy();
                }
            }
        });
    });
};

export default createModelTest;
