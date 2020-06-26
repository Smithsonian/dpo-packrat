import { GetUserInput, GetUserResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const utils = new TestSuiteUtils();
utils.setupJest();

let graphQLApi: GraphQLApi;

beforeAll(() => {
    graphQLApi = utils.graphQLApi;
});

describe('Query: getUser', () => {
    test('should work with valid input', async () => {
        const input: GetUserInput = {
            idUser: 0
        };

        const { User }: GetUserResult = await graphQLApi.getUser(input);

        if (User) {
            expect(User.idUser).toBe(0);
        } else {
            expect(User).toBe(null);
        }
    });
});
