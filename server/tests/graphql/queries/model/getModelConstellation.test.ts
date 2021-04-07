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

            if (ModelConstellation) {
                expect(ModelConstellation.Model).toBeFalsy();
            } else {
                expect(ModelConstellation).toBe(null);
            }
        });
    });
};

export default getModelConstellationTest;
