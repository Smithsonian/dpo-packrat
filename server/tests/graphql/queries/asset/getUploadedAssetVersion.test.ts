import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import { Context } from '../../../../types/resolvers';
import { CreateUserInput } from '../../../../types/graphql';

const getUploadedAssetVersionTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createUserInput: () => CreateUserInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUserInput = utils.createUserInput;
    });

    describe('Query: getUploadedAssetVersion', () => {
        test('should work with valid input', async () => {
            const userInput = createUserInput();
            const { User } = await graphQLApi.createUser(userInput);
            expect(User).toBeTruthy();

            if (User) {
                const context: Context = {
                    user: User,
                    isAuthenticated: true
                };
                const { AssetVersion } = await graphQLApi.getUploadedAssetVersion(context);
                // A freshly-created user has no uploaded (staged) asset versions.
                expect(Array.isArray(AssetVersion)).toBe(true);
            }
        });
    });
};

export default getUploadedAssetVersionTest;
