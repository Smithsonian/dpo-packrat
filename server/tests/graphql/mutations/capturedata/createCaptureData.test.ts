import { CreateCaptureDataInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createCaptureDataTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Mutation: createCaptureData', () => {
        test('should work with valid input', async () => {
            const vocabularySetArgs = {
                Name: 'Test Vocabulary Set',
                SystemMaintained: false,
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

                if (Vocabulary) {
                    const captureData: CreateCaptureDataInput = {
                        idVCaptureMethod: Vocabulary.idVocabulary,
                        idVCaptureDatasetType: Vocabulary.idVocabulary,
                        DateCaptured: new Date(),
                        Description: 'Test Description',
                        CaptureDatasetFieldID: 0,
                        ItemPositionFieldID: 0,
                        ItemArrangementFieldID: 0,
                        idVBackgroundRemovalMethod: Vocabulary.idVocabulary,
                        ClusterGeometryFieldID: 0,
                        CameraSettingsUniform: true,
                        idVItemPositionType: Vocabulary.idVocabulary,
                        idVFocusType: Vocabulary.idVocabulary,
                        idVLightSourceType: Vocabulary.idVocabulary,
                        idVClusterType: Vocabulary.idVocabulary
                    };

                    const { CaptureData } = await graphQLApi.createCaptureData(captureData);
                    expect(CaptureData).toBeTruthy();
                }
            }
        });
    });
};

export default createCaptureDataTest;
