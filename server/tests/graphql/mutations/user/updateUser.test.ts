import { UpdateUserInput } from '../../../../types/graphql';
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
                Name: randomStorageKey('testUser'),
                EmailAddress: randomStorageKey('test@si.edu'),
                SecurityID: 'SECURITY_ID',
                Active: true,
                DateActivated: new Date(),
                DateDisabled: null,
                WorkflowNotificationTime: new Date(),
                EmailSettings: 0,
                idUser: 0
            };

            const user = await new DBAPI.User(userArgs);
            if (await user.create()) {
                const updateUserInput: UpdateUserInput = {
                    idUser: user.idUser,
                    Name: randomStorageKey('testUser'),
                    EmailAddress: randomStorageKey('test@si.edu'),
                    EmailSettings: 2,
                    WorkflowNotificationTime: '11:59:59',
                    Active: true
                };

                const updatedUser = await graphQLApi.updateUser(updateUserInput);
                if (updatedUser) {
                    expect(updatedUser.User?.Name).toEqual(updateUserInput.Name);
                    expect(updatedUser.User?.EmailAddress).toEqual(updateUserInput.EmailAddress);
                    expect(updatedUser.User?.EmailSettings).toEqual(updateUserInput.EmailSettings);
                    expect(updatedUser.User?.WorkflowNotificationTime).toEqual(updateUserInput.WorkflowNotificationTime);
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
                idUser: 0
            };

            const user = await new DBAPI.User(userArgs);
            if (await user.create()) {
                const updateUserInput: UpdateUserInput = {
                    idUser: user.idUser,
                    Name: randomStorageKey('testUser'),
                    EmailAddress: randomStorageKey('test@si.edu'),
                    EmailSettings: 2,
                    WorkflowNotificationTime: '11:59:59',
                    Active: false
                };

                const updatedUser = await graphQLApi.updateUser(updateUserInput);
                if (updatedUser) {
                    expect(updatedUser.User?.Active).toEqual(false);
                    expect(updatedUser.User?.Active).not.toBe(user?.Active);
                    expect(user.DateDisabled).toBeNull();
                    expect(updatedUser.User?.DateDisabled).not.toBeNull();
                }
            }
        });
    });
};
export default updateUserTest;
