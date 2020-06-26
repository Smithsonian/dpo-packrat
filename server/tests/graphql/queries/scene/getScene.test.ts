import { GetSceneInput, GetSceneResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const utils = new TestSuiteUtils();
utils.setupJest();

let graphQLApi: GraphQLApi;

beforeAll(() => {
    graphQLApi = utils.graphQLApi;
});

describe('Query: getScene', () => {
    test('should work with valid input', async () => {
        const input: GetSceneInput = {
            idScene: 0
        };

        const { Scene }: GetSceneResult = await graphQLApi.getScene(input);

        if (Scene) {
            expect(Scene.idScene).toBe(0);
        } else {
            expect(Scene).toBe(null);
        }
    });
});
