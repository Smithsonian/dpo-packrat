import { GetProjectListInput, GetProjectListResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';
import { randomStorageKey } from '../../../db/utils';

const getProjectListTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getProjectList', () => {
        test('should work with valid input', async () => {
            const randomName = randomStorageKey('Test Project');
            const projectArgs = {
                Name: randomName,
                Description: null,
                idProject: 0
            };

            const project = new DBAPI.Project(projectArgs);
            expect(await project.create()).toBeTruthy();

            const input: GetProjectListInput = {
                search: randomName
            };

            const { projects }: GetProjectListResult = await graphQLApi.getProjectList(input);
            expect(projects).toBeTruthy();
            expect(projects.length).toBe(1);
            expect(projects[0].Name).toEqual(randomName);
        });
    });
};

export default getProjectListTest;
