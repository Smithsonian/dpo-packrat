import { CreateProjectInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createProjectTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createProjectInput: () => CreateProjectInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createProjectInput = utils.createProjectInput;
    });

    describe('Mutation: createProject', () => {
        test('should work with valid input', async () => {
            const projectArgs: CreateProjectInput = createProjectInput();
            const { Project } = await graphQLApi.createProject(projectArgs);
            expect(Project).toBeTruthy();
        });
    });
};

export default createProjectTest;
