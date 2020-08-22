import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';
import { CreateUserInput, GetContentsForAssetVersionsInput } from '../../../../types/graphql';
import { Asset, AssetVersion } from '@prisma/client';

const getContentsForAssetVersionsTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createUserInput: () => CreateUserInput;
    let createAssetInput: () => Asset;
    let createAssetVersionInput: (idAsset: number, idUser: number) => AssetVersion;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUserInput = utils.createUserInput;
        createAssetInput = utils.createAssetInput;
        createAssetVersionInput = utils.createAssetVersionInput;
    });

    describe('Query: getContentsForAssetVersions', () => {
        test('should work with valid input', async () => {
            const assetInput = createAssetInput();
            const asset = new DBAPI.Asset(assetInput);

            const userInput = createUserInput();
            const { User } = await graphQLApi.createUser(userInput);

            // TODO: KARAN: fix this test
            const createdAsset = await asset.create();
            // expect(createdAsset).toBe(true);

            if (createdAsset && User) {
                const assetVersionInput = createAssetVersionInput(asset.idAsset, User.idUser);
                const assetVersion = new DBAPI.AssetVersion(assetVersionInput);
                if (await assetVersion.create()) {
                    const getContentsInput: GetContentsForAssetVersionsInput = {
                        idAssetVersions: [assetVersion.idAsset]
                    };

                    const { AssetVersionContent } = await graphQLApi.getContentsForAssetVersions(getContentsInput);
                    expect(AssetVersionContent).toBeTruthy;
                }
            }
        });
    });
};

export default getContentsForAssetVersionsTest;
