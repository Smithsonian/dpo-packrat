import { GetVocabularyEntriesInput, GetVocabularyEntriesResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as COMMON from '../../../../../client/src/types/server';

const getVocabularyEntriesTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getVocabularyEntries', () => {
        test('should work with valid input', async () => {
            const input: GetVocabularyEntriesInput = {
                eVocabSetIDs: [
                    COMMON.eVocabularySetID.eIdentifierIdentifierType,
                    COMMON.eVocabularySetID.eCaptureDataDatasetType,
                    COMMON.eVocabularySetID.eCaptureDataItemPositionType,
                    COMMON.eVocabularySetID.eCaptureDataFocusType,
                    COMMON.eVocabularySetID.eCaptureDataLightSourceType,
                    COMMON.eVocabularySetID.eCaptureDataBackgroundRemovalMethod,
                    COMMON.eVocabularySetID.eCaptureDataClusterType,
                    COMMON.eVocabularySetID.eCaptureDataFileVariantType
                ]
            };

            const { VocabularyEntries }: GetVocabularyEntriesResult = await graphQLApi.getVocabularyEntries(input);

            expect(VocabularyEntries).toBeTruthy();
            expect(VocabularyEntries[0].eVocabSetID).toBe(COMMON.eVocabularySetID.eIdentifierIdentifierType);
        });
    });
};

export default getVocabularyEntriesTest;
