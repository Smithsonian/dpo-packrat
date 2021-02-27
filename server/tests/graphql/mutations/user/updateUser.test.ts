// import { CreateUserInput, UpdateUserInput } from '../../../../types/graphql';
// import GraphQLApi from '../../../../graphql';
// import TestSuiteUtils from '../../utils';

// const updateUserTest = (utils: TestSuiteUtils): void => {
//     let graphQLApi: GraphQLApi;
//     let updateUserInput: UpdateUserInput = {
//         idUser,
//         Name,
//         EmailAddress,
//         EmailSettings,
//         WorkflowNotificationTime,
//         Active
//     };

//     beforeAll(() => {
//         graphQLApi = utils.graphQLApi;
//     });

//     describe('Mutation: createUser', () => {
//         test('should work with valid input', async () => {
//             const userArgs: UpdateUserInput = {
//                 idUser,
//                 Name,
//                 EmailAddress,
//                 EmailSettings,
//                 WorkflowNotificationTime,
//                 Active
//             };
//             const updatedUser = await graphQLApi.createUser(userArgs);
//             expect(createdUser.User).toBeTruthy();
//         });
//     });
// };

// export default updateUserTest;
