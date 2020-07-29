import { CreateCaptureDataInput, CreateVocabularySetInput, CreateVocabularyInput, CreateCaptureDataPhotoInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createCaptureDataTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createVocabularyInput: (idVocabularySet: number) => CreateVocabularyInput;
    let createVocabularySetInput: () => CreateVocabularySetInput;
    let createCaptureDataInput: (idVocabulary: number) => CreateCaptureDataInput;
    let createCaptureDataPhotoInput: (idCaptureData: number, idVocabulary: number) => CreateCaptureDataPhotoInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createVocabularyInput = utils.createVocabularyInput;
        createVocabularySetInput = utils.createVocabularySetInput;
        createCaptureDataInput = utils.createCaptureDataInput;
        createCaptureDataPhotoInput = utils.createCaptureDataPhotoInput;
    });

    describe('Mutation: createCaptureData', () => {
        test('should work with valid input', async () => {
            const vocabularySetArgs: CreateVocabularySetInput = createVocabularySetInput();
            const { VocabularySet } = await graphQLApi.createVocabularySet(vocabularySetArgs);
            expect(VocabularySet).toBeTruthy();

            if (VocabularySet) {
                const vocabularyArgs: CreateVocabularyInput = createVocabularyInput(VocabularySet.idVocabularySet);
                const { Vocabulary } = await graphQLApi.createVocabulary(vocabularyArgs);
                expect(Vocabulary).toBeTruthy();

                if (Vocabulary) {
                    const captureData: CreateCaptureDataInput = createCaptureDataInput(Vocabulary.idVocabulary);
                    const { CaptureData } = await graphQLApi.createCaptureData(captureData);
                    expect(CaptureData).toBeTruthy();

                    if (CaptureData) {
                        const captureDataPhoto: CreateCaptureDataPhotoInput = createCaptureDataPhotoInput(CaptureData.idCaptureData, Vocabulary.idVocabulary);
                        const { CaptureDataPhoto } = await graphQLApi.createCaptureDataPhoto(captureDataPhoto);
                        expect(CaptureDataPhoto).toBeTruthy();
                    }
                }
            }
        });
    });
};

export default createCaptureDataTest;
