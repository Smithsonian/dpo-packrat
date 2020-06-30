import { CreateSceneInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createSceneTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Mutation: createScene', () => {
        test('should work with valid input', async () => {
            const sceneArgs: CreateSceneInput = {
                Name: 'Test Scene',
                HasBeenQCd: true,
                IsOriented: true
            };

            const { Scene } = await graphQLApi.createScene(sceneArgs);
            expect(Scene).toBeTruthy();
        });
    });
};

export default createSceneTest;
