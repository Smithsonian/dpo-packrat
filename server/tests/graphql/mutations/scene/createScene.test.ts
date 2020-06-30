import { CreateSceneInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createSceneTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createSceneInput: () => CreateSceneInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createSceneInput = utils.createSceneInput;
    });

    describe('Mutation: createScene', () => {
        test('should work with valid input', async () => {
            const sceneArgs: CreateSceneInput = createSceneInput();
            const { Scene } = await graphQLApi.createScene(sceneArgs);
            expect(Scene).toBeTruthy();
        });
    });
};

export default createSceneTest;
