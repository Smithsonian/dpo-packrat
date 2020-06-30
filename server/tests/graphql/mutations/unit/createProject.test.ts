import { CreateProjectInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createProjectTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Mutation: createProject', () => {
        test('should work with valid input', async () => {
            const projectArgs: CreateProjectInput = {
                Name: 'Test Name',
                Description: 'Test Description'
            };

            const { Project } = await graphQLApi.createProject(projectArgs);
            expect(Project).toBeTruthy();
        });
    });
};

export default createProjectTest;
