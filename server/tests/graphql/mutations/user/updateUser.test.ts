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

            const newTime = new Date();
            const user = await new DBAPI.User(userArgs);

            if (await user.create()) {
                const updateUserInput: UpdateUserInput = {
                    idUser: user.idUser,
                    Name: randomStorageKey('testUser'),
                    EmailAddress: randomStorageKey('test@si.edu'),
                    EmailSettings: 2,
                    WorkflowNotificationTime: newTime,
                    Active: true
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
                idUser: 0
            };

            const user = await new DBAPI.User(userArgs);
            const newTime = new Date();

            if (await user.create()) {
                console.log('here is user', user);
                const updateUserInput: UpdateUserInput = {
                    idUser: user.idUser,
                    Name: randomStorageKey('testUser'),
                    EmailAddress: randomStorageKey('test@si.edu'),
                    EmailSettings: 2,
                    WorkflowNotificationTime: newTime,
                    Active: false
                };

                const { User }: GetUserResult = await graphQLApi.updateUser(updateUserInput);
                console.log('here is User', User)
                if (User) {
                    expect(User?.Active).toEqual(false);
                    expect(User?.Active).not.toBe(user?.Active);
                    expect(user.DateDisabled).toBeNull();
                    expect(User?.DateDisabled).not.toBeNull();
                }
            }
        });
    });
};
export default updateUserTest;
