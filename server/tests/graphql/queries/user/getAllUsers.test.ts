// import { GetAllUsersInput, GetAllUsersResult } from '../../../../types/graphql';
// import GraphQLApi from '../../../../graphql';
// import TestSuiteUtils from '../../utils';
// import * as DBAPI from '../../../../db';

// const getAllUsersTest = (utils: TestSuiteUtils): void => {
//     let graphQLApi: GraphQLApi;

//     beforeAll(() => {
//         graphQLApi = utils.graphQLApi;
//     });

//     describe('Query: getAllUsers', () => {
//         test('should work with valid input', async () => {
//             const userArgs = {
//                 Name: 'Test User',
//                 EmailAddress: 'test@si.edu',
//                 SecurityID: 'SECURITY_ID',
//                 Active: true,
//                 DateActivated: new Date(),
//                 DateDisabled: null,
//                 WorkflowNotificationTime: new Date(),
//                 EmailSettings: 0,
//                 idUser: 0
//             };

//             const user = new DBAPI.User(userArgs);
//             if (await user.create()) {
//                 const input: GetAllUsersInput = {
//                     idUser: user.idUser
//                 };

//                 const { User }: GetAllUsersResult = await graphQLApi.getUser(input);

//                 if (User) {
//                     expect(User.idUser).toBe(user.idUser);
//                 }
//             }
//         });
//     });
// };

// export default getAllUsersTest;
