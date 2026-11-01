import { GetSceneInput, GetSceneResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const getSceneTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getScene', () => {
        test('returns null for a non-existent id', async () => {
            // Positive retrieval needs a scene fixture with backing files (record
            // building logs Utils.Scene errors without them); assert not-found here.
            const input: GetSceneInput = { idScene: 0 };
            const { Scene }: GetSceneResult = await graphQLApi.getScene(input);
            expect(Scene).toBeNull();
        });
    });
};

export default getSceneTest;
