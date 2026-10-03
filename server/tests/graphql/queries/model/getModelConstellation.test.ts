import { GetModelConstellationInput, GetModelConstellationResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const getModelConstellationTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getModelConstellation', () => {
        test('should work with valid input', async () => {
            const input: GetModelConstellationInput = {
                idModel: 0
            };

            const { ModelConstellation }: GetModelConstellationResult = await graphQLApi.getModelConstellation(input);

            // A non-existent model yields no constellation (null) or one with no Model.
            expect(ModelConstellation?.Model ?? null).toBeNull();
        });
    });
};

export default getModelConstellationTest;
