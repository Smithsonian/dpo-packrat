import { CreateUserInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createUserTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createUserInput: () => CreateUserInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUserInput = utils.createUserInput;
    });

    describe('Mutation: createUser', () => {
        test('should work with valid input', async () => {
            const userArgs: CreateUserInput = createUserInput();
            const createdUser = await graphQLApi.createUser(userArgs);
            expect(createdUser.User).toBeTruthy();
        });
    });
};

export default createUserTest;
