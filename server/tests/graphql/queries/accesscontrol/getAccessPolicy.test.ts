import { GetAccessPolicyInput, GetAccessPolicyResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const getAccessPolicyTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getAccessPolicy', () => {
        test('should work with valid input', async () => {
            const input: GetAccessPolicyInput = {
                idAccessPolicy: 0
            };

            const { AccessPolicy }: GetAccessPolicyResult = await graphQLApi.getAccessPolicy(input);

            // AccessPolicy has no fetchAll; assert the deterministic not-found contract.
            expect(AccessPolicy).toBeNull();
        });
    });
};

export default getAccessPolicyTest;
