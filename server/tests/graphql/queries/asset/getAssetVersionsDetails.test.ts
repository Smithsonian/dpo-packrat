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

    describe('Query: getAssetVersionsDetails', () => {
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
                                idAssetVersions: [assetVersion.idAssetVersion]
                            };

                            const { valid, Details } = await graphQLApi.getAssetVersionsDetails(getContentsInput, { user: User, isAuthenticated: true });
                            expect(valid).toBeTruthy();
                            expect(Details.length).toBeGreaterThan(0);
                            /*
                            // TODO: construct a test case for bulk ingest that creates ingestion metadata, and then validate that ingestion metadata here:
                            if (Details.length > 0) {
                                const { SubjectUnitIdentifier, Project, Item } = Details[0];
                                expect(SubjectUnitIdentifier).toBeTruthy();
                                expect(Project).toBeTruthy();
                                expect(Item).toBeTruthy();
                            }
                            */
                        }
                    }
                }
            }
        });
    });
};

export default getAssetVersionDetailsTest;
