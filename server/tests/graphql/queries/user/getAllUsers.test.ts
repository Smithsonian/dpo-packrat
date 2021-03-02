import { GetAllUsersInput, GetAllUsersResult, User_Status } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

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
    });

    describe('Query: getAllUsers', () => {
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
    });

    describe('Query: getAllUsers', () => {
        test('should return inactive users', async () => {
            const input: GetAllUsersInput = {
                search: '',
                active: User_Status.EInactive
            };
            const users: GetAllUsersResult = await graphQLApi.getAllUsers(input);
            const { User } = users;

            User.forEach((user) => {
                expect(user.Active).toEqual(false);
            })
        });
    });

    describe('Query: getAllUsers', () => {
        test('should return users with matching name or email', async () => {
            const input: GetAllUsersInput = {
                search: 'jon',
                active: User_Status.EAll
            };
            const users: GetAllUsersResult = await graphQLApi.getAllUsers(input);
            const { User } = users;

            User.forEach((user) => {
                expect(user.Name || user.EmailAddress).toMatch(/[Jj]on/);
            });
        });
    });
};

export default getAllUsersTest;
