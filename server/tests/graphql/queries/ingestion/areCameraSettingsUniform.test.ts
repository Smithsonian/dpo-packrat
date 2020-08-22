import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';
import { CreateUserInput, AreCameraSettingsUniformInput } from '../../../../types/graphql';
import { Asset, AssetVersion } from '@prisma/client';

const areCameraSettingsUniformTest = (utils: TestSuiteUtils): void => {
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

    describe('Query: areCameraSettingsUniform', () => {
        test('should work with valid input', async () => {
            const assetInput = createAssetInput();
            const asset = new DBAPI.Asset(assetInput);

            const userInput = createUserInput();
            const { User } = await graphQLApi.createUser(userInput);

            // TODO: KARAN: fix this test
            const createdAsset = await asset.create();
            //  expect(createdAsset).toBe(true);

            if (createdAsset && User) {
                const assetVersionInput = createAssetVersionInput(asset.idAsset, User.idUser);
                const assetVersion = new DBAPI.AssetVersion(assetVersionInput);
                if (await assetVersion.create()) {
                    const cameraSettingUniformInput: AreCameraSettingsUniformInput = {
                        idAssetVersion: assetVersion.idAsset
                    };

                    const result = await graphQLApi.areCameraSettingsUniform(cameraSettingUniformInput);
                    expect(typeof result.isUniform).toBe('boolean');
                }
            }
        });
    });
};

export default areCameraSettingsUniformTest;
