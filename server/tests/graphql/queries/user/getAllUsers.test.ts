/* eslint-disable camelcase */

import { GetAllUsersInput, GetAllUsersResult, User_Status } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';
import { randomStorageKey } from '../../../db/utils';


const getAllUsersTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });


    describe('Query: getAllUsers', () => {
        test('should return numerous users', async () => {
            const input: GetAllUsersInput = {
                search: '',
                active: User_Status.EAll
            };
            const users: GetAllUsersResult = await graphQLApi.getAllUsers(input);
            const { User } = users;
            // This should always return true when running the graphql.test suite because getUser.test.ts creates a user
            if (User) {
                expect(User.length).toBeGreaterThanOrEqual(1);
            }
        });

        test('should return active users', async () => {
            const input: GetAllUsersInput = {
                search: '',
                active: User_Status.EActive
            };
            const users: GetAllUsersResult = await graphQLApi.getAllUsers(input);
            const { User } = users;

            User.forEach((user) => {
                expect(user.Active).toEqual(true);
            });
        });

        test('should return inactive users', async () => {
            const input: GetAllUsersInput = {
                search: '',
                active: User_Status.EInactive
            };
            const users: GetAllUsersResult = await graphQLApi.getAllUsers(input);
            const { User } = users;

            User.forEach((user) => {
                expect(user.Active).toEqual(false);
            });
        });

        test('should return users with matching email', async () => {
            const randomName = randomStorageKey('getAllUsers');
            const randomEmail = randomStorageKey('getAllUsers@example.com');

            const userArgs = {
                Name: randomName,
                EmailAddress: randomEmail,
                SecurityID: 'SECURITY_ID',
                Active: true,
                DateActivated: new Date(),
                DateDisabled: null,
                WorkflowNotificationTime: new Date(),
                EmailSettings: 0,
                idUser: 0
            };

            new DBAPI.User(userArgs);

            const input: GetAllUsersInput = {
                search: randomEmail,
                active: User_Status.EAll
            };

            const users: GetAllUsersResult = await graphQLApi.getAllUsers(input);
            const { User } = users;

            expect(User.length).toEqual(1);
            expect(User[0].EmailAddress).toEqual(randomEmail);
        });
    });
};

export default getAllUsersTest;
