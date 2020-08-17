import { GetVocabularyEntriesInput, GetVocabularyEntriesResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import { eVocabularySetID } from '../../../../cache';

const getVocabularyEntriesTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getVocabularyEntries', () => {
        test('should work with valid input', async () => {
            const input: GetVocabularyEntriesInput = {
                eVocabSetIDs: [
                    eVocabularySetID.eIdentifierIdentifierType,
                    eVocabularySetID.eCaptureDataDatasetType,
                    eVocabularySetID.eCaptureDataItemPositionType,
                    eVocabularySetID.eCaptureDataFocusType,
                    eVocabularySetID.eCaptureDataLightSourceType,
                    eVocabularySetID.eCaptureDataBackgroundRemovalMethod,
                    eVocabularySetID.eCaptureDataClusterType
                ]
            };

            const { VocabularyEntries }: GetVocabularyEntriesResult = await graphQLApi.getVocabularyEntries(input);

            expect(VocabularyEntries).toBeTruthy();
            expect(VocabularyEntries[0].eVocabSetID).toBe(eVocabularySetID.eIdentifierIdentifierType);
        });
    });
};

export default getVocabularyEntriesTest;
