import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import { CreateProjectInput } from '../../../../types/graphql';
import * as UTIL from './../../../db/api';

const getProjectDocumentationTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createProjectInput: () => CreateProjectInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createProjectInput = utils.createProjectInput;
    });

    describe('Query: getProjectDocumentation', () => {
        test('should work with valid input', async () => {
            const projectInput = createProjectInput();
            const { Project } = await graphQLApi.createProject(projectInput);

            if (Project) {
                const { idProjectDocumentation } = await UTIL.createProjectDocumentationTest({
                    idProject: Project.idProject,
                    Name: 'Test Project Documentation',
                    Description: 'Test Description',
                    idProjectDocumentation: 0
                });

                const projectDocumentationInput = {
                    idProjectDocumentation
                };

                const { ProjectDocumentation } = await graphQLApi.getProjectDocumentation(projectDocumentationInput);
                expect(ProjectDocumentation).toBeTruthy();
                if (ProjectDocumentation) {
                    expect(ProjectDocumentation.idProjectDocumentation).toBe(idProjectDocumentation);
                }
            }
        });
    });
};

export default getProjectDocumentationTest;
