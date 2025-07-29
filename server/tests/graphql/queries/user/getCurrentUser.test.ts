import { GetUserResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';
import { Context } from '../../../../types/resolvers';

const getCurrentUser = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getCurrentUser', () => {
        test('should work with valid context', async () => {
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
                const context: Context = {
                    user,
                    isAuthenticated: true
                };

                const { User }: GetUserResult = await graphQLApi.getCurrentUser(context);

                if (User) {
                    expect(User.idUser).toBe(user.idUser);
                }
            }
        });

        test('should return null with unauthenticated context', async () => {
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
                const context: Context = {
                    user: undefined,
                    isAuthenticated: false
                };

                const { User }: GetUserResult = await graphQLApi.getCurrentUser(context);

                expect(User).toBe(null);
            }
        });
    });
};

export default getCurrentUser;
