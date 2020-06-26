import { GetWorkflowInput, GetWorkflowResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const getWorkflowTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getWorkflow', () => {
        test('should work with valid input', async () => {
            const input: GetWorkflowInput = {
                idWorkflow: 0
            };

            const { Workflow }: GetWorkflowResult = await graphQLApi.getWorkflow(input);

            if (Workflow) {
                expect(Workflow.idWorkflow).toBe(0);
            } else {
                expect(Workflow).toBe(null);
            }
        });
    });
};

export default getWorkflowTest;
