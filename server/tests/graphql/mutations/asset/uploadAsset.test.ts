import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import { UploadAssetInput, AssetType, UploadStatus } from '../../../../types/graphql';
import { Context } from '../../../../types/resolvers';
import { CreateUserInput } from '../../../../types/graphql';
import fs from 'fs';
import { join } from 'path';

const uploadAssetTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createUserInput: () => CreateUserInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUserInput = utils.createUserInput;
    });

    describe('Mutation: uploadAsset', () => {
        test('should work with valid input', async () => {
            const userInput = createUserInput();
            const { User } = await graphQLApi.createUser(userInput);

            if (User) {
                const context: Context = {
                    user: User,
                    isAuthenticated: true
                };

                const filename: string = 'mock.upload.ts';
                const path: string = join(__dirname, `${filename}`);
                const file = fs.createReadStream(path);

                const uploadAssetInput: UploadAssetInput = {
                    file: {
                        createReadStream: () => file,
                        filename,
                        encoding: 'us-ascii',
                        mimetype: 'text/plain'
                    },
                    type: AssetType.Photogrammetry
                };

                const { status } = await graphQLApi.uploadAsset(uploadAssetInput, context);
                expect(status).toBe(UploadStatus.Complete);
            }
        });

        test('should fail with invalid input', async () => {
            const userInput = createUserInput();
            const { User } = await graphQLApi.createUser(userInput);

            if (User) {
                const context: Context = {
                    user: User,
                    isAuthenticated: true
                };

                const uploadAssetInput: UploadAssetInput = {
                    file: null,
                    type: AssetType.Photogrammetry
                };

                await expect(graphQLApi.uploadAsset(uploadAssetInput, context)).rejects.toThrow();
            }
        });
    });
};

export default uploadAssetTest;
