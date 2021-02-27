import { UpdateUserInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const updateUserTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Mutation: updateUser', () => {
        test('should update user name, email, email settings, and workflownotificationtime', async () => {
            const updateUserInput: UpdateUserInput = {
                idUser: 1,
                Name: 'Jon Ty',
                EmailAddress: 'tyj@si.edu',
                EmailSettings: 2,
                WorkflowNotificationTime: '11:59:59',
                Active: true
            };
            const updatedUser = await graphQLApi.updateUser(updateUserInput);
            expect(updatedUser.User?.Name).toEqual(updateUserInput.Name);
            expect(updatedUser.User?.EmailAddress).toEqual(updateUserInput.EmailAddress);
            expect(updatedUser.User?.EmailSettings).toEqual(updateUserInput.EmailSettings);
            expect(updatedUser.User?.WorkflowNotificationTime).toEqual(updateUserInput.WorkflowNotificationTime);
        });
    });

    describe('Mutation: updateUser', () => {
        test('should update date disabled and active if marking user as inactive', async () => {
            const { User } = await graphQLApi.getUser({ idUser: 1 });

            const updateUserInput: UpdateUserInput = {
                idUser: 1,
                Name: 'Jon Ty',
                EmailAddress: 'tysonj@si.edu',
                EmailSettings: 1,
                WorkflowNotificationTime: '11:59:59',
                Active: false
            };
            const updatedUser = await graphQLApi.updateUser(updateUserInput);
            expect(updatedUser.User?.Active).toEqual(false);
            expect(updatedUser.User?.Active).not.toBe(User?.Active);
            expect(User?.DateDisabled).toBeNull();
            expect(updatedUser.User?.DateDisabled).toBeNull();

        });
    });
};
export default updateUserTest;
