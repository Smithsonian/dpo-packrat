import { CreateUserInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createUserTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Mutation: createUser', () => {
        test('should work with valid input', async () => {
            const userArgs: CreateUserInput = {
                Name: 'Test User',
                EmailAddress: 'test@si.edu',
                SecurityID: 'SECURITY_ID'
            };

            const createdUser = await graphQLApi.createUser(userArgs);
            expect(createdUser.User).toBeTruthy();
        });
    });
};

export default createUserTest;
