import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';
import { CreateUserInput, GetAssetVersionsDetailsInput, CreateVocabularySetInput, CreateVocabularyInput } from '../../../../types/graphql';
import { Asset, AssetVersion } from '@prisma/client';

const getAssetVersionDetailsTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createUserInput: () => CreateUserInput;
    let createAssetInput: (idVAssetType: number) => Asset;
    let createAssetVersionInput: (idAsset: number, idUser: number) => AssetVersion;
    let createVocabularyInput: (idVocabularySet: number) => CreateVocabularyInput;
    let createVocabularySetInput: () => CreateVocabularySetInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUserInput = utils.createUserInput;
        createAssetInput = utils.createAssetInput;
        createAssetVersionInput = utils.createAssetVersionInput;
        createVocabularyInput = utils.createVocabularyInput;
        createVocabularySetInput = utils.createVocabularySetInput;
    });

    describe('Query: getAssetVersionDetails', () => {
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

                    const userInput = createUserInput();
                    const { User } = await graphQLApi.createUser(userInput);

                    const createdAsset = await asset.create();
                    expect(createdAsset).toBe(true);

                    if (createdAsset && User) {
                        const assetVersionInput = createAssetVersionInput(asset.idAsset, User.idUser);
                        const assetVersion = new DBAPI.AssetVersion(assetVersionInput);
                        if (await assetVersion.create()) {
                            const getContentsInput: GetAssetVersionsDetailsInput = {
                                idAssetVersions: [assetVersion.idAsset]
                            };

                            const { SubjectUnitIdentifier, Project, Item } = await graphQLApi.getAssetVersionsDetails(getContentsInput);
                            expect(SubjectUnitIdentifier).toBeTruthy();
                            expect(Project).toBeTruthy();
                            expect(Item).toBeTruthy();
                        }
                    }
                }
            }
        });
    });
};

export default getAssetVersionDetailsTest;
