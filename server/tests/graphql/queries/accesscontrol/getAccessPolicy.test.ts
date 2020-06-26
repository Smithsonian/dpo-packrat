import { GetAccessPolicyInput, GetAccessPolicyResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const utils = new TestSuiteUtils();
utils.setupJest();

let graphQLApi: GraphQLApi;

beforeAll(() => {
    graphQLApi = utils.graphQLApi;
});

const getAccessPolicyTest = (): void => {
    describe('Query: getAccessPolicy', () => {
        test('should work with valid input', async () => {
            const input: GetAccessPolicyInput = {
                idAccessPolicy: 0
            };

            const { AccessPolicy }: GetAccessPolicyResult = await graphQLApi.getAccessPolicy(input);

            if (AccessPolicy) {
                expect(AccessPolicy.idAccessPolicy).toBe(0);
            } else {
                expect(AccessPolicy).toBe(null);
            }
        });
    });
};

export default getAccessPolicyTest;
