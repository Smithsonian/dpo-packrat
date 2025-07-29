import { GetUserInput, GetUserResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';

const getUserTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getUser', () => {
        test('should work with valid input', async () => {
            const userArgs = {
                Name: 'Test User',
                EmailAddress: 'test@si.edu',
                SecurityID: 'SECURITY_ID',
                Active: true,
                DateActivated: new Date(),
                DateDisabled: null,
                WorkflowNotificationTime: new Date(),
                EmailSettings: 0,
                idUser: 0,
                SlackID: ''
            };

            const user = new DBAPI.User(userArgs);
            if (await user.create()) {
                const input: GetUserInput = {
                    idUser: user.idUser
                };

                const { User }: GetUserResult = await graphQLApi.getUser(input);

                if (User) {
                    expect(User.idUser).toBe(user.idUser);
                }
            }
        });
    });
};

export default getUserTest;
