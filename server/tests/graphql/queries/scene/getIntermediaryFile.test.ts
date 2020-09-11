import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';
import * as UTIL from '../../../db/api';
import { CreateVocabularySetInput, CreateVocabularyInput } from '../../../../types/graphql';
import { Asset } from '@prisma/client';

const getIntermediaryFileTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createAssetInput: (idVAssetType: number) => Asset;
    let createVocabularyInput: (idVocabularySet: number) => CreateVocabularyInput;
    let createVocabularySetInput: () => CreateVocabularySetInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createAssetInput = utils.createAssetInput;
        createVocabularyInput = utils.createVocabularyInput;
        createVocabularySetInput = utils.createVocabularySetInput;
    });

    describe('Query: getIntermediaryFile', () => {
        test('should work with valid input', async () => {
            const vocabularySetArgs: CreateVocabularySetInput = createVocabularySetInput();
            const { VocabularySet } = await graphQLApi.createVocabularySet(vocabularySetArgs);
            expect(VocabularySet).toBeTruthy();

            if (VocabularySet) {
                const vocabularyArgs: CreateVocabularyInput = createVocabularyInput(VocabularySet.idVocabularySet);
                const { Vocabulary } = await graphQLApi.createVocabulary(vocabularyArgs);
                expect(Vocabulary).toBeTruthy();

                if (Vocabulary) {
                    const assetInput = createAssetInput(Vocabulary.idVocabulary);
                    const asset = new DBAPI.Asset(assetInput);

                    const createdAsset = await asset.create();
                    expect(createdAsset).toBe(true);

                    if (createdAsset) {
                        const { idIntermediaryFile } = await UTIL.createIntermediaryFileTest({
                            idAsset: asset.idAsset,
                            DateCreated: UTIL.nowCleansed(),
                            idIntermediaryFile: 0
                        });

                        const intermediaryFileInput = {
                            idIntermediaryFile
                        };

                        const { IntermediaryFile } = await graphQLApi.getIntermediaryFile(intermediaryFileInput);

                        expect(IntermediaryFile).toBeTruthy();
                        if (IntermediaryFile) {
                            expect(IntermediaryFile.idIntermediaryFile).toBe(idIntermediaryFile);
                        }
                    }
                }
            }
        });
    });
};

export default getIntermediaryFileTest;
