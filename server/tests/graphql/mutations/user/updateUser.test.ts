import { GetUserResult, UpdateUserInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';
import { randomStorageKey } from '../../../db/utils';

const updateUserTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Mutation: updateUser', () => {
        test('should update user name, email, email settings, and workflownotificationtime', async () => {
            const userArgs = {
                Name: randomStorageKey('updateUser'),
                EmailAddress: randomStorageKey('test@si.edu'),
                SecurityID: 'SECURITY_ID',
                Active: true,
                DateActivated: new Date(),
                DateDisabled: null,
                WorkflowNotificationTime: new Date(),
                EmailSettings: 0,
                idUser: 0,
                SlackID: ''
            };

            const newTime = new Date();
            const user = await new DBAPI.User(userArgs);

            if (await user.create()) {
                const updateUserInput: UpdateUserInput = {
                    idUser: user.idUser,
                    Name: randomStorageKey('updateUser'),
                    EmailAddress: randomStorageKey('test@si.edu'),
                    EmailSettings: 2,
                    WorkflowNotificationTime: newTime,
                    Active: true,
                    SlackID: ''
                };

                const { User }: GetUserResult = await graphQLApi.updateUser(updateUserInput);
                if (User) {
                    expect(User?.Name).toEqual(updateUserInput.Name);
                    expect(User?.EmailAddress).toEqual(updateUserInput.EmailAddress);
                    expect(User?.EmailSettings).toEqual(updateUserInput.EmailSettings);
                    expect(User?.WorkflowNotificationTime).toEqual(updateUserInput.WorkflowNotificationTime);
                }
            }
        });

        test('should update datedisabled and active if marking user as inactive', async () => {
            const userArgs = {
                Name: randomStorageKey('testUser'),
                EmailAddress: randomStorageKey('test@si.edu'),
                SecurityID: 'SECURITY_ID',
                Active: true,
                DateActivated: new Date(),
                DateDisabled: null,
                WorkflowNotificationTime: new Date(),
                EmailSettings: 0,
                idUser: 0,
                SlackID: ''
            };

            const user = await new DBAPI.User(userArgs);
            const newTime = new Date();

            if (await user.create()) {
                const updateUserInput: UpdateUserInput = {
                    idUser: user.idUser,
                    Name: randomStorageKey('disablinguser'),
                    EmailAddress: randomStorageKey('test@si.edu'),
                    EmailSettings: 2,
                    WorkflowNotificationTime: newTime,
                    Active: false,
                    SlackID: ''
                };

                const { User: updatedUser }: GetUserResult = await graphQLApi.updateUser(updateUserInput);
                if (updatedUser) {
                    expect(updatedUser?.Active).toEqual(false);
                    expect(updatedUser?.Active).not.toBe(user?.Active);
                    expect(user.DateDisabled).toBeNull();
                    expect(updatedUser?.DateDisabled).not.toBeNull();
                }
            }
        });
    });
};
export default updateUserTest;
