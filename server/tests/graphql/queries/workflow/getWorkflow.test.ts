import { GetWorkflowInput, GetWorkflowResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const getWorkflowTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getWorkflow', () => {
        test('returns null for a non-existent id', async () => {
            // Workflow has no fetchAll; assert the deterministic not-found contract.
            const input: GetWorkflowInput = { idWorkflow: 0 };
            const { Workflow }: GetWorkflowResult = await graphQLApi.getWorkflow(input);
            expect(Workflow).toBeNull();
        });
    });
};

export default getWorkflowTest;
